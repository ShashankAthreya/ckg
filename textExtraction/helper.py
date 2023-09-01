# from tika import parser
import textract
from rdflib import Graph, Literal, Namespace, RDF
from keyphrasetransformer import KeyPhraseTransformer
from sentence_transformers import SentenceTransformer
import umap
import hdbscan
import numpy as np
from collections import Counter
from operator import itemgetter
import json
from concurrent.futures import ThreadPoolExecutor
import re
from nltk.corpus import stopwords
from typing import List


# Load Sentence-BERT (uses mean pooling by default)
model = SentenceTransformer('roberta-base-nli-stsb-mean-tokens')

# Initialise KPT
kp = KeyPhraseTransformer()

stop_words = set(stopwords.words('english'))
remove_words = ["summary", "outline", "discussion"]
brackets_regex = r'\(.*?\)'
abbrs_regex = r'\b[A-Z]{2,}\b'  # Matches all uppercase abbreviations
dates_regex = r'\b(\d{1,2}\/){2}\d{2,4}\b'  # Matches dates in the format dd/mm/yy or dd/mm/yyyy
menti_codes_regex = r'\b\d{8}\b'  # Matches 8-digit Menti codes
urls_regex = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'  # Matches URLs

def preprocess_topic(topic: str) -> str:
    # Convert to lowercase
    topic = topic.lower()

    # Remove URLs
    topic = re.sub(urls_regex, "", topic)

    # Remove parts of code and comments
    topic = re.sub("`.*?`", "", topic)  # Remove inline code enclosed in `
    topic = re.sub("```.*?```", "", topic, flags=re.DOTALL)  # Remove code blocks enclosed in ```
    topic = re.sub("#.*?$", "", topic, flags=re.MULTILINE)  # Remove comments starting with #

    # Remove words in brackets
    topic = re.sub(brackets_regex, "", topic)

    # Remove abbreviations
    topic = re.sub(abbrs_regex, "", topic)

    # Remove dates
    topic = re.sub(dates_regex, "", topic)

    # Remove Menti codes
    topic = re.sub(menti_codes_regex, "", topic)

    # Tokenize the topic
    words = topic.split()

    # Remove stopwords, filler words, and specified words
    words = [word for word in words if word not in stop_words and word not in remove_words]

    # Rejoin the words into a single string
    return ' '.join(words)

def extract_text_from_pdf(file_path):
    # Parse the PDF file
    content = textract.process(file_path)
    # Get the text content
    content = content.decode('utf-8')
    
    # Split the content by a specific pattern that indicates a new page
    content = content.replace('\n\n', '\n')
    content = re.sub(r'\\u\w{4}', '', content)  
    pages = content.split('\f')

    # Extract the title from each page
    with ThreadPoolExecutor() as executor:
        titles = list(executor.map(lambda page: page.split('\n')[0], pages))
        topics_per_page = list(executor.map(kp.get_key_phrases, pages))
    # topics_per_page = [sublist[:3] for sublist in topics_per_page]

    with ThreadPoolExecutor() as executor:
        # Preprocess each sublist in the 2d array
        topics_per_page = [list(executor.map(preprocess_topic, sublist)) for sublist in topics_per_page]

    doc_overview = dict(zip(titles, topics_per_page))
    
    # Specify the words to exclude
    exclude_words = ['recap', 'outline', 'discussion','summary','remix']

    # Remove empty keys and keys containing the exclude words
    doc_overview = {key: value for key, value in doc_overview.items() 
                    if key and not any(word in key.lower() for word in exclude_words)}

    with open('./main_title_topic_dict.json', 'w') as file:
        json.dump(doc_overview, file)

    return doc_overview


def create_clusters(topics):
    flat_topics = [item for sublist in topics for item in sublist]
    # Get embeddings for all topics
    topic_embeddings = model.encode(flat_topics)
    # Use UMAP for dimensionality reduction
    umap_embeddings = umap.UMAP(n_neighbors=15, n_components=5, metric='cosine').fit_transform(topic_embeddings)

    # Use HDBSCAN for clustering
    clusterer = hdbscan.HDBSCAN(min_cluster_size=5, gen_min_span_tree=True)
    clusters = clusterer.fit_predict(umap_embeddings)

    # Assign and display clusters
    topic_cluster = list(zip(flat_topics, clusters))
    # print(topic_cluster)

    num_clusters = len(set(clusters))
    clusters = []
    for i in range(num_clusters):
        cluster = []
        cluster.append([t[0] for t in topic_cluster if t[1] == i])
        cluster = list(dict.fromkeys([item for sublist in cluster for item in sublist]))
        if not cluster:
            continue
        clusters.append(cluster)
    # with open('./clusters.txt', 'w') as f:
    #     for row in clusters:
    #         f.write(', '.join(row))
    #         f.write('\n')
    # Convert inner lists to tuples
    clusters_tuples = [list(map(tuple, cluster)) if isinstance(cluster[0], list) else cluster for cluster in clusters]

    # Flatten all the clusters to count occurrences
    all_topics = [topic for cluster in clusters_tuples for topic in cluster]

    # Create a counter dict for all topics
    topic_counts = Counter(all_topics)

    # Prepare a list of tuples each containing sum of occurrences of topics and the cluster itself
    clusters_with_counts = [(sum(topic_counts[topic] for topic in cluster), cluster) for cluster in clusters]

    # Sort clusters based on sum of occurrences of their topics
    sorted_clusters = list(map(itemgetter(1), sorted(clusters_with_counts, key=itemgetter(0), reverse=True)))

    # with open('./processed_clusters.txt', 'w') as f:
    #     for row in sorted_clusters:
    #         f.write(', '.join(row))
    #         f.write('\n')
    return clusters, sorted_clusters
    
def clean_dict(d):
    clean_d = {}
    for key, values in d.items():
        new_key = key.replace('\u2022', '').strip()
        if new_key:  # if the new key is not empty after removals and strip
            new_values = [value.replace('\u2022', '').strip() for value in values if value.replace('\u2022', '').strip()]
            if new_values:  # if there are any non-empty values left
                clean_d[new_key] = new_values
    return clean_d


def transform_data(topics):
    rdf_data_dict = {}
    for topic, info in topics.items():
        course = topic.replace(" ", "_")
        rdf_data_dict[course] = (info["type"], info["coverage_level"], info["has_topics"])
    return rdf_data_dict

def create_rdf(data_dict):
    dbo = Namespace("http://dbpedia.org/ontology/")
    ex = Namespace("http://example.org/")
    g = Graph()
    for course, details in data_dict.items():
        g.add((ex[course], RDF.type, dbo[details[0]]))
        g.add((ex[course], dbo.coverage_level, Literal(details[1])))
        g.add((ex[course], dbo.has_topics, ex[details[2]]))
    return g.serialize(format='turtle')

