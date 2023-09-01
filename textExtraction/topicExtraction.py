import time
start = time.time()
import textract
import re
# import nltk
# nltk.download('brown')
from topicModelling import topicModelling
from nltk.corpus import brown
from nltk.tokenize import word_tokenize
import enchant
d = enchant.Dict("en_US")
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from concurrent.futures import ThreadPoolExecutor
from collections import defaultdict
import logging

logging.getLogger('pyenchant').setLevel(logging.CRITICAL)

ps = PorterStemmer()


stop_words = set(stopwords.words('english'))

# from keyphrasetransformer import KeyPhraseTransformer
# kp = KeyPhraseTransformer()

from rake_nltk import Rake
r = Rake() 

word_set = set(brown.words())
cs_word_set = set(['decentralized','appending', 'blockchain','bitcoin', 'ethereum', 'blockchains', 'sha256', 'binary', 'bool', 'c', 'c++', 'algorithm', 'server', 'node', 'database', 'internet', 'ethereum', 'blockchain', 'bitcoin', 'cryptographer', 'javascript', 'https', 'jvm', 'linux', 'hyperledger', 'remix', 'struct', 'cryptocurrency', 'software', 'hardware', 'protocol', 'pow', 'p2p', 'dapp', 'evm', 'ganache', 'truffle', 'metamask', 'constructor', 'runtime', 'deterministically', 'deploy', 'initialize', 'cryptocurrency', 'blockchains','turning','selfdestruct','cryptocurrency','quasi–turing','lovelace'])
init_set = cs_word_set

def preprocess(text):
    text = text.lower()
    lines = text.split("\n")
    filtered_text = []
    for line in lines:
        tokenized_line = word_tokenize(line)
        if len(tokenized_line) >= 2:
            filtered_line = []
            for token in tokenized_line:
                if token in word_set or token in cs_word_set:
                    filtered_line.append(token)
                elif d.check(token):
                    filtered_line.append(token)
                    cs_word_set.add(token)  # add new words to cs_word_set
            filtered_text.append(' '.join(filtered_line))
    return('. '.join(filtered_text))

def get_topics(page):
    # return (kp.get_key_phrases(preprocess(page)))
    r.extract_keywords_from_text(preprocess(page))
    return(r.get_ranked_phrases())

content = textract.process('/Users/sam/Documents/VU/Thesis/Lecture Slides/22-w6-l2-smartcontracts-cona.pdf')
content = content.decode('utf-8')
content = content.replace('\n\n', '\n')
content = re.sub('[^a-zA-Z0-9.,;\n\f]', ' ', content)

pages = content.split('\f')

topics = []
for page in pages:
    topics.append(get_topics(page))


topics = [list(set(topic)) for topic in topics]

topics = [
    [
        ' '.join(
            word for word in sentence.split() 
            if (word.isalpha() or word.isalnum()) 
            and not word.isdigit() 
            and len(word) >= 3
        ) 
        for sentence in sublist
    ] 
    for sublist in topics
]
def remove_duplicates(lst):
    result = []
    for sublist in lst:
        if sublist not in result:
            result.append(sublist)
    return result


topics = [[item for item in sublist if item] for sublist in topics if sublist]
topics = remove_duplicates(topics)
topics = [[item for item in sublist if item] for sublist in topics if sublist]


word_counts = defaultdict(int)

for topicList in topics:
    for topic in topicList:
        for word in topic.split():
            word_counts[word] += 1

single_occurrence_set = set([word for word, count in word_counts.items() if count == 1])


new_topics = []

for topicList in topics:
    new_topicList = []
    for topic in topicList:
        words = topic.split()
        new_topic = [word for word in words if word not in single_occurrence_set and words.count(word) == 1]
        new_topic_str = ' '.join(new_topic)
        if new_topic_str not in new_topicList:
            new_topicList.append(new_topic_str)
    new_topics.append(new_topicList)

topics = new_topics
topics = [[item for item in sublist if item] for sublist in topics if sublist]


# print(topics[:3])
hierarchy = topicModelling(topics,0.82)


from sklearn.cluster import AgglomerativeClustering
from sklearn.feature_extraction.text import TfidfVectorizer

# Let's assume that your 2D list of topics is stored in the variable "topics"

# First, we need to flatten the 2D list into a 1D list
flattened_topics = [item for sublist in topics for item in sublist]

# Then, we use TfidfVectorizer to convert the list of topics into a matrix of TF-IDF features
vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(flattened_topics)

# Now, we can perform hierarchical clustering
clustering = AgglomerativeClustering(n_clusters=5)  # Let's assume that we want 5 clusters
clusters = clustering.fit_predict(X.toarray())

# "clusters" is now a 1D array where each element is the cluster label of the corresponding topic


import matplotlib.pyplot as plt
from scipy.cluster.hierarchy import dendrogram, linkage

linked = linkage(X.toarray(), 'ward')

plt.figure(figsize=(10, 7))
dendrogram(linked, orientation='top', distance_sort='descending', show_leaf_counts=True)
plt.show()



print(time.time() - start)


