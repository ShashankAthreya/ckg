import json
# Your dictionary
with open('./subDomains.json', 'r') as json_file:
    subdomains_dict = json.load(json_file)
# Data Preparation
topics = []
labels = []
for subdomain, topic_list in subdomains_dict.items():
    for topic in topic_list:
        topics.append(topic)
        labels.append(subdomain)

import torch
from transformers import BertTokenizer, BertForSequenceClassification, Trainer, TrainingArguments
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from torch.utils.data import Dataset, DataLoader

class CustomDataset(Dataset):
    def __init__(self, topics, labels, tokenizer, max_len):
        self.topics = topics
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.topics)

    def __getitem__(self, idx):
        topic = str(self.topics[idx])
        label = self.labels[idx]

        encoding = self.tokenizer.encode_plus(
            topic,
            add_special_tokens=True,
            max_length=self.max_len,
            return_token_type_ids=False,
            pad_to_max_length=True,
            return_attention_mask=True,
            return_tensors='pt',
        )

        return {
            'text': topic,
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'labels': torch.tensor(label, dtype=torch.long)
        }

# Convert labels to integers
unique_labels = list(set(labels))
label2int = {label: i for i, label in enumerate(unique_labels)}
int2label = {i: label for label, i in label2int.items()}
labels = [label2int[label] for label in labels]

# Split data
X_train, X_test, y_train, y_test = train_test_split(topics, labels, test_size=0.1, random_state=42, stratify=labels)

# BERT tokenizer
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
max_len = max([len(tokenizer.encode(topic)) for topic in topics])

# Create Datasets
train_dataset = CustomDataset(X_train, y_train, tokenizer, max_len)
test_dataset = CustomDataset(X_test, y_test, tokenizer, max_len)

# Model & Training
model = BertForSequenceClassification.from_pretrained('bert-base-uncased', num_labels=len(unique_labels))

training_args = TrainingArguments(
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    num_train_epochs=18,
    evaluation_strategy="steps",
    logging_dir='./logs',
    logging_steps=100,
    do_train=True,
    do_eval=True,
    no_cuda=False,
    load_best_model_at_end=True,
    save_steps=10_000,
    save_total_limit=2,
    remove_unused_columns=True,
    run_name='run_name',
    logging_first_step=False,
    output_dir='./output'
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=test_dataset
)

trainer.train()

# Evaluation
predictions, label_ids, metrics = trainer.predict(test_dataset)
# preds = torch.argmax(predictions, dim=1).tolist()
preds = torch.argmax(torch.tensor(predictions), dim=1).tolist()
accuracy = accuracy_score(y_test, preds)
print(f"Accuracy: {accuracy * 100:.2f}%")

# Optionally save model
# model.save_pretrained("your_path_to_save")

model.save_pretrained("./model")
tokenizer.save_pretrained("./model")

