import concurrent.futures
import string
import spacy
import json
import warnings

# Ignore UserWarning
warnings.filterwarnings("ignore", category=UserWarning)

# Your code here

nlp = spacy.load('en_core_web_md')

# topics = [['smart contracts', 'decentralized application', 'smart contracts'], ['decentralized systems', 'ledgers', 'challenges'], ['btc total input', 'btc transaction fee total output'], ['consensus', 'blockchain node', 'synchronization', 'blockchain consensus algorithm performance evaluation criteria'], ['atomic write operation', 'cap consistency', 'partition tolerance', 't1 consistency', 'partition tolerance availability', 'hot topics in operating systems', 'blockchain', 'cryptography'], ['proof of work', 'cryptography', 'ethereum blockchain', 'blockmetainformation', 'bitcoin blockchain node'], ['hexadecimal string', 'sha256 string'], ['branching', 'approximation'], ['goto menti.com', 'code 84565097'], ['smart contracts', 'decentralized application dapp', 'smart contracts'], ['distributed application', 'decentralized application', 'development lifecycle', 'discussion smart contract'], ['distributed application', 'decentralized application', 'development lifecycle', 'discussion smart contract'], ['online voting'], ['voting service', 'client-server architecture', 'vote, add/update candidate, vote,', 'get results'], ['client server architectures', 'performance issues', 'single point of failure', 'voting results', 'service provider'], ['user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface user interface'], ['decouple layer', 'component', 'voting service'], ['master-slave redistribution requests to a slave node slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting service slave voting'], ['cloud loadbalancer', 'network traffic', 'application level information'], ['single point of failure performance', 'overloaded server', 'big demands network connectivity'], ['multi node', 'centralized management'], ['p2p example 1 extend client server architecture'], ['p2p example 1 extend client server architecture'], ['p2p example 2 completely remove the server peers can directly interact with any other peers'], ['p2p', 'dynamic servers'], ['unstructured p2p'], ['peer to peer system', 'deterministic topology', 'distributed hash table dht'], ['peer to peer p2p network', 'bitcoin blockchain'], ['distributed application', 'smart contract', 'ethereum virtual machine', 'development lifecycle'], ['decentralized applications', 'dapp', 'dapps', 'smart contracts', 'distributed ledger technology', 'autonomous software', 'blockchain'], ['ethereum', 'smart contracts', 'blockchain', 'bitcoin', 'second generation of blockchain'], ['smart contract', 'immutable computer programs', 'hyperledger fabric', 'chain code smart contract'], ['decentralized scenario', 'deploy code binary compile deploy'], ['smart contracts', 'ethereum virtual machine'], ['java virtual machine', 'jvm accepts specific types of code bytecodes or mac file systems', 'jvm', 'os'], ['virtual machine', 'vm virtual machine'], ['virtual machines', 'java virtual machines', 'virtual box virtual machines'], ['distributed application', 'decentralized application', 'development lifecycle'], ['smart contract language', 'lll', 'serpent', 'solidity', 'javascript', '12/7/22 39'], ['smart contract language', 'solidity', 'ethereum'], ['smart contract', 'pragma solidity 0.4.0 0.6.0'], ['smart contract', 'pragma solidity', 'version boundary', 'version 0.8.17'], ['smart contract', 'pragma solidity 0.4.0 0.6.0', 'public view returns'], ['smart contract', 'pragma solidity 0.4.0 0.6.0'], ['smart contract', 'pragma solidity 0.4.0 0.6.0', 'simplestorage'], ['smart contract', 'simplestorage', 'struct mapping'], ['smart contract', 'pragma solidity 0.4.0 0.6.0'], ['smart contract', 'pragma solidity 0.4.0 0.6.0'], ['contract state variables function local variables global variables block 0 genesis debits 100.00 200.00 3 column ledger accounts example credits balances 100.00 300.00 120.00 160.00'], ['smart contract', 'pragma solidity 0.4.0 0.6.0', 'public view returns'], ['smart contract', 'pragma solidity 0.4.0 0.6.0'], ['contract storage', 'smart contract', 'pragma solidity 0.4.0 0.6.0'], ['contract storage', 'smart contract', 'pragma solidity 0.4.0 0.6.0'], ['distributed application', 'decentralized application', 'development lifecycle', 'discussion smart contract'], ['smart contract', 'lifecycle', 'ethereum', 'selfdestruct'], ['smart contract development', 'ethereum virtual machine', 'blockchain metamask'], ['smart contract deployment'], ['smart contract', 'state machine view'], ['smart contract', 'smart contract execution', 'smart contract deployment', 'eoa', 'blockchain', 'transactional transactions', 'deploy ment init'], ['ethereum address account externally owned accounts eoas like the bitcoin address perform cryptocurrency transactions'], ['smart contract deployment'], ['smart contract', 'self-destruct addr operation', 'state machine view'], ['smart contract deployment', 'state of the smart contract', 'ethereum virtual machine state of the blockchain transaction mem- pool'], ['turing complete state machine', 'virtual currency', '12/7/22 64'], ['miner fee transaction fee', 'gas price per unit'], ['ethereum currency units', 'denominations', 'wei wei 1 1,000 kilowei or femtoether or picoether or microether or microether or microether or microether or microether or microether or microether or microether or microether or microether or microether or microether or microether or microether or microether or microether or microether or microether or microether or microether or microether or microether or microether or microether or microether or microether or microether'], ['gas fee', 'normal transaction', 'execution', 'out of gas exception'], ['smart contract', 'transaction cost'], ['smart contract', 'cost of a smart contract'], ['distributed application', 'decentralized application', 'development lifecycle', 'discussion smart contract'], ['voting use case scenario'], ['smart contract', 'smart contract state of the voting smart contract'], ['smart contract', 'voting smart contract state of the voting smart contract'], ['smart contract', 'solidity', 'data structure', 'contract', 'constructor function'], ['smart contract', 'smart contract operation', 'voting smart contract'], ['smart contract', 'voting smart contract', 'output depends on the rule 12/7/22 76'], ['cont.', 'contract voting', 'smart contract voting', 'id public view'], ['remix'], [], ['smart contract', 'double voting set constraints'], ['discussion menti.com code 73576389 12/7/22 81'], [], []]
def topicModelling(topics,threshold = 0.78):
    topics = [item for sublist in topics for item in sublist]
    topics = [''.join(ch for ch in topic.lower() if ch not in string.punctuation) for topic in topics]

    # Pre-compute nlp results for each topic
    nlp_topics = {topic: nlp(topic) for topic in topics}
    # Prepare a set to ensure uniqueness of keys/values
    seen = set()

    # Construct and filter the hierarchy
    hierarchy = {}
    for i, topic1 in enumerate(topics):
        if topic1 not in seen and len(topic1) <= 40:
            seen.add(topic1)
            related_topics = []
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future_similarities = {executor.submit(nlp_topics[topic1].similarity, nlp_topics[topic2]): topic2 for topic2 in topics}
                for future in concurrent.futures.as_completed(future_similarities):
                    topic2 = future_similarities[future]
                    try:
                        similarity = future.result()
                    except Exception as exc:
                        print('%r generated an exception: %s' % (topic2, exc))
                    else:
                        if similarity > threshold and topic2 != topic1 and len(topic2) <= 40 and topic2 not in seen:
                            seen.add(topic2)
                            related_topics.append(topic2)
            if related_topics:  # if related_topics is not empty
                hierarchy[topic1] = related_topics

    # Save to json
    with open('./title_topic_dict.json', 'w') as file:
        json.dump(hierarchy, file)
    
    return(hierarchy)
