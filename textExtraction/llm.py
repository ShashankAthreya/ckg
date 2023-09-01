import time

start = time.time()
# from rake_nltk import Rake
import re


from keyphrasetransformer import KeyPhraseTransformer
kp = KeyPhraseTransformer()
# r = Rake() 

from multiprocessing import Pool
 
import textract
import re
from nltk.corpus import brown
from nltk.tokenize import word_tokenize

import enchant
d = enchant.Dict("en_US")

word_set = set(brown.words())
cs_word_set = set(['decentralized','appending', 'blockchain','bitcoin', 'ethereum', 'blockchains', 'sha256', 'binary', 'bool', 'c', 'c++', 'algorithm', 'server', 'node', 'database', 'internet', 'ethereum', 'blockchain', 'bitcoin', 'cryptographer', 'javascript', 'https', 'jvm', 'linux', 'hyperledger', 'remix', 'struct', 'cryptocurrency', 'software', 'hardware', 'protocol', 'pow', 'p2p', 'dapp', 'evm', 'ganache', 'truffle', 'metamask', 'constructor', 'runtime', 'deterministically', 'deploy', 'initialize', 'cryptocurrency', 'blockchains','turning','selfdestruct','cryptocurrency','quasi–turing','lovelace'])

filtered_word_set = set(['decentralized application','smart contracts'])

new_words = []

def preprocess(text):
    global new_words
    text = re.sub('[^a-zA-Z0-9.,-/;]', ' ', text)
    text = re.sub(r'\(.*?\)|\{.*?\}', ' ', text)
    text = text.lower()
    lines = text.split("\n")
    filtered_text = [
        ' '.join(token for token in word_tokenize(line) if token in word_set or token in cs_word_set or d.check(token))
        for line in lines
        if len(word_tokenize(line)) >= 2
    ]
    return('. '.join(filtered_text))

content = textract.process('/Users/sam/Downloads/22-w6-l2-smartcontracts-cona.pdf')

# Get the text content
content = content.decode('utf-8')

# Split the content by a specific pattern that indicates a new page
content = content.replace('\n\n', '\n')
pages = content.split('\f')
def get_key_phrases(text):
    # I'm assuming that kp is some keyword extractor you have defined elsewhere
    return kp.get_key_phrases(text)

def process_page(page):
    preprocessed_page = preprocess(page)
    return get_key_phrases(preprocessed_page)

for page in pages:
    # page = preprocess(page)
    # r.extract_keywords_from_text(preprocess(page))
    # print(r.get_ranked_phrases())
    # print(page)
    print(kp.get_key_phrases(preprocess(page)))

with Pool() as p:
    results = p.map(process_page, pages)

print(time.time()-start)
