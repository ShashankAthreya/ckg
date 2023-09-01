import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
from scipy.cluster.hierarchy import dendrogram, linkage
from sklearn.cluster import AgglomerativeClustering

topics = [['smart contracts', 'dapp', 'decentralized application'], ['block chain', 'consensus', 'blockchain nodes', 'private key', 'distributed', 'decentralized systems', 'network', 'account', 'public key', 'distributed'], ['total output', 'block', 'different', 'transactions', 'inputs value', 'total input', 'transaction', 'hash', 'new transaction', 'inputs outputs transaction fee', 'block', 'new blocks', 'signature', 'first peer node announce', 'outputs value', 'propagate', 'peer nodes miner run consensus algorithms', 'blockchain p2p network', 'transactions', 'peer nodes', 'node', 'new block', 'nodes'], ['blockchain', 'blockchain consensus algorithms performance https', 'runtime', 'blocks protocols', 'transactions', 'proof', 'different new candidate', 'consensus', 'blockchain network', 'different', 'new blocks', 'nodes', 'part', 'change', 'protocols', 'model', 'use', 'usually', 'consensus blockchain nodes make', 'software', 'consensus', 'node', 'chain', 'confirmation', 'blockchain nodes', 'different state', 'make', 'block', 'work pow'], ['partition may', 'nodes partition', 'via', 'write operation write', 'read', 'without', 'one part', 'system', 'systems', 'write trans', 'write', 'propagate', 'work', 'network', 'node', 'non', 'node', 'write trans', 'read trans', 'blockchain', 'client', 'requests', 'operating systems', 'part', 'write', 'write results'], ['nodes miner', 'number called nonce', 'announce', 'bitcoin blockchain', 'network', 'hash sha256', 'consensus', 'used', 'nonce', 'blockchain', 'number', 'based', 'one first', 'work', 'ethereum blockchains', 'new block', 'example proof', 'sha256 sha256 nonce start', 'computation proof', 'make', 'bitcoin', 'work pow'], ['different output', 'string sha256 sha256 version time nonce', 'computing', 'completely', 'output string', 'may change', 'input string', 'sha256 string', 'change', 'time'], ['winners', 'blocks', 'winners', 'longer high', 'block', 'block', 'longer'], ['code'], ['discussion', 'development', 'ethereum virtual machine', 'decentralized application', 'programming language', 'example', 'distributed application', 'smart contract'], ['candidates via internet', 'reliable', 'online voting example', 'image', 'announce', 'transparent', 'candidates', 'example', 'participants', 'news', 'results', 'system', 'remotely vote one', 'voting'], ['discussion', 'vote', 'client server', 'post candidate vote', 'voting results', 'candidate', 'specific', 'post candidate', 'view candidates', 'server', 'service', 'get candidate', 'client request', 'get candidate', 'return list', 'add', 'query', 'get confirmation', 'problems', 'client', 'get', 'start', 'server', 'function'], ['network connectivity', 'overloaded server due', 'service', 'performance issues', 'discussion', 'voting results', 'bad connection', 'big demands', 'specific', 'client server', 'server', 'failure', 'single point', 'non transparent manipulation'], ['client server two tier', 'tier', 'user', 'tier'], ['vote', 'client', 'voting results', 'candidate', 'return list', 'data', 'get confirmation', 'different machines', 'view candidates', 'query', 'multi tier'], ['voting service', 'master slave', 'client', 'slave node', 'voting service', 'requests', 'master node'], ['level information', 'requests', 'network', 'based', 'example cloud', 'application'], ['discussion', 'network connectivity', 'overloaded server due', 'service', 'performance issues', 'voting results', 'specific', 'bad connection', 'big demands', 'server', 'failure', 'single point', 'non transparent manipulation', 'problems'], ['client', 'peer', 'centralized', 'without', 'different nodes', 'access', 'multi nodes', 'peer', 'centralized point'], ['extend client server', 'clients', 'p2p example', 'directly interact'], ['multi servers', 'extend client server', 'clients', 'p2p example', 'directly interact'], ['peers', 'completely', 'p2p example', 'server', 'directly interact'], ['one', 'p2p', 'clients', 'p2p example', 'servers', 'directly interact', 'servers'], ['unstructured p2p', 'topology among peers'], ['peer p2p system', 'peers', 'structured peer', 'etc using distributed hash', 'structured', 'topology'], ['among peers', 'physical', 'peer p2p network', 'used', 'p2p', 'peer', 'bitcoin blockchain structured', 'network', 'topology', 'unstructured', 'underlying physical'], ['discussion', 'development', 'ethereum virtual machine', 'decentralized application', 'example', 'programming language', 'distributed application', 'smart contract'], ['often', 'run', 'distributed ledger', 'state', 'ethereum blockchain', 'application', 'smart contracts', 'network https', 'https', 'system', 'blockchain', 'decentralized applications dapp', 'dapp', 'computer application', 'software', 'decentralized network', 'blockchain', 'distributed computing'], ['often called', 'blockchains', 'ethereum', 'ledger', 'support smart', 'ethereum based dapp', 'specified', 'bitcoin', 'first blockchain', 'blockchain'], ['computer', 'perform', 'smart contract', 'set', 'blockchains support smart contracts', 'ethereum', 'protocols within', 'part', 'called chain code', 'specified', 'ethereum network', 'run'], ['machines', 'run applications', 'run', 'centralized scenario', 'decentralized scenario', 'application'], ['gas', 'ethereum virtual machine', 'memory', 'address', 'calling', 'operations', 'storage access', 'block operations', 'add', 'system operations', 'smart contracts compiled', 'operations', 'runtime environment'], ['java virtual machine jvm', 'accepts specific types', 'jvm execution', 'mac', 'compiled code java file', 'win', 'file systems', 'compiled code', 'operating system', 'linux', 'jvm', 'java virtual', 'virtual machines', 'execute', 'underlying'], ['operating system linux', 'like', 'system', 'application', 'operating', 'cloud', 'virtual machine', 'normal', 'mac', 'win', 'service', 'virtual machines', 'executed', 'physical machine'], ['discussion', 'evm', 'virtual virtual machines', 'one', 'different virtual machines', 'java virtual machines', 'similar'], ['first high level smart contract language', 'python like syntax', 'programming language syntax', 'similar', 'syntax similar', 'python solidity', 'serpent', 'used serpent', 'different smart contract high level language', 'used language', 'java'], ['ethereum solidity', 'created', 'high level smart contract language', 'https ethereum solidity', 'solidity', 'number'], [ 'function set public', 'solidity', 'contract', 'smart contract example', 'constructor public', 'return'], [ 'version', 'current version', 'function set public', 'solidity', 'contract', 'smart contract example', 'version', 'constructor public', 'solidity', 'return', 'language'], ['name',  'function set public', 'solidity', 'contract', 'smart contract example', 'constructor public', 'return', 'contract body'], ['name', 'contract storage',  'contain multi', 'function set public', 'solidity', 'one program may', 'smart contract example', 'contract', 'constructor public', 'return', 'contract body'], ['one contract', 'contract storage', 'contract', 'function set public', 'return', 'contract body', 'name',  'solidity', 'smart contract example', 'contain multi', 'one program may', 'constructor public'], [ 'complex data types', 'function set public', 'solidity', 'contract', 'smart contract example', 'constructor public', 'data types', 'return', 'define variables'], ['contract storage', 'local variable',  'state variable', 'function set public', 'solidity', 'contract', 'smart contract example', 'permanently', 'constructor public', 'return', 'within', 'function'], ['contract storage', 'local variable', 'state variable', 'contract', 'within', 'function set public', 'return', 'blockchain', 'global variable',  'solidity', 'permanently', 'smart contract example', 'constructor public', 'function'], ['ledger accounts example', 'block', 'local variables', 'hash', 'block', 'contract state variables', 'global variables', 'signature', 'block'], [ 'created', 'function set public', 'solidity', 'constructor execute', 'smart contract example', 'contract', 'constructor public', 'return'], [ 'one', 'function set public', 'solidity', 'contract', 'smart contract example', 'private', 'constructor public', 'return', 'within', 'public', 'internal current'], ['discussion', 'function public', 'function internal', 'contract storage', 'function', 'solidity', 'contract', 'smart contract example', 'work', 'constructor public', 'function private'], ['code', 'evm', 'high level language', 'ethereum', 'use dapp', 'run', 'code', 'solidity', 'smart contract', 'deploy deploy', 'selfdestruct', 'create create smart contract using', 'compile compile', 'invoke'], ['compile solidity', 'smart contract development', 'online development environment', 'interact', 'emulated ethereum virtual machine', 'private test blockchain', 'deploy', 'different ethereum', 'test', 'blockchain'], ['deployed', 'blockchain', 'calling', 'smart', 'return', 'compiled smart contract', 'special smart contract', 'address'], ['state', 'state', 'state variables', 'calling', 'changed', 'state machine view', 'smart contract value', 'function via transactions', 'smart contract', 'state', 'state'], ['transactions deployment', 'two transactions', 'special build', 'smart contract', 'state', 'send smart contract deployment request', 'new state', 'stored', 'value', 'transaction', 'smart contract code', 'created', 'changed', 'blockchain', 'smart contract deployed', 'initialization', 'deployment', 'build', 'externally owned account', 'contract account', 'user', 'blockchain', 'execute', 'executed', 'initialize'], ['externally owned accounts', 'contract accounts', 'ethereum address account', 'invoke', 'execute', 'perform transactions', 'smart contract', 'owned', 'like', 'usually owned', 'smart contract address', 'send transaction', 'bitcoin address', 'function'], ['deployment operation', 'generated', 'send', 'smart contract deployment', 'smart contract', 'transactions', 'stored', 'key like', 'ethereum network', 'private public', 'transaction', 'block', 'blockchain', 'generated based', 'contract creation transaction', 'owned addresses', 'contract creation', 'send transactions etc', 'smart contract address', 'owned'], ['two transactions', 'address', 'contract', 'smart contract', 'invoke', 'via selfdestruct operation', 'state machine view', 'deployment', 'self', 'self'], ['transaction', 'initialization', 'node', 'storage', 'ethereum virtual', 'changed', 'operation', 'consensus', 'cost', 'smart contract', 'state'], ['complete state machine', 'ethereum virtual machine evm', 'gas', 'ethereum', 'ether', 'gas fee', 'smart contract', 'ether', 'virtual currency', 'complete state machine ethereum yellow paper', 'total computation', 'node'], ['gas cost', 'gas unit', 'actual cost charged', 'miner fee', 'gas transaction fee unit', 'miner', 'gas limit', 'transaction fee gas cost units gas price unit'], ['name', 'value', 'name', 'ether', 'ethereum currency units'], ['actual cost', 'charged', 'ether gas limit gas cost gas price', 'normal transaction', 'gas limit', 'execution', 'gas fee', 'actual gas cost', 'gas', 'gas'], ['gas cost', 'etc discussion', 'cost', 'smart contract may', 'transaction cost', 'smart contract', 'runtime', 'computation'], ['discussion', 'high cost', 'different operation', 'complex smart contract operations', 'smart contract gas', 'ethereum yellow paper cost model', 'smart contract', 'cost'], ['candidates via internet', 'reliable', 'image', 'announce', 'transparent', 'candidates', 'voting use', 'participants', 'news', 'results', 'system', 'remotely vote one', 'voting'], ['voting smart contract', 'create', 'smart contract', 'state'], ['voting smart contract', 'candidate', 'votes', 'create', 'candidate information', 'smart contract', 'state'], ['string name', 'constructor function', 'initialize three candidates', 'voting results', 'contract', 'candidate', 'list', 'using solidity', 'addresses', 'smart contract', 'state', 'candidate', 'votes', 'smart contract voting', 'example', 'name', 'accepts', 'solidity', 'define', 'data structure called candidate', 'contract voting', 'candidate', 'candidates', 'initialize', 'data structure', 'three candidates'], ['operation', 'voting smart contract', 'create', 'smart contract'], ['operation', 'vote', 'voting smart contract', 'output', 'candidate', 'create', 'smart contract'], ['solidity', 'returns string memory', 'function', 'vote', 'define', 'contract voting', 'return', 'get', 'voting results', 'smart contract voting', 'specific candidate', 'returns'], ['https', 'contract', 'emulated', 'test', 'using', 'blockchain'], ['add', 'smart contract', 'voting', 'voting', 'set'], ['online', 'https', 'read']]

topics = [item for sublist in topics for item in sublist]

# Create a linkage matrix using 'ward' method
Z = linkage(topics, 'ward')

# Plot dendrogram
plt.figure(figsize=(10, 7))
plt.title("Topic Dendograms")
dend = dendrogram(Z)
plt.show()


# Create clusters (we choose 2 clusters for this example)
cluster = AgglomerativeClustering(n_clusters=2, affinity='euclidean', linkage='ward')
cluster.fit_predict(topics)

print(cluster)