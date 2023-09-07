# 🚀 CKG - Curriculum Knowledge Graph 

Welcome to the CKG repository, the go-to place for the Curriculum Knowledge Graph. Dive in to find out how to set up, run, and interact with CKG.

## 🛠️ Installation & Setup

### 1. Install Node Modules
To set up the required dependencies, run:

```bash
npm install
```

### 2. Start the Server

Use `nodemon` to have the server automatically restart after file changes:

```bash
nodemon start
```

### 3. Initialize the Fuseki Server

Replace `path_to_fuseki` with the actual path to your Fuseki directory:

```bash
./path_to_fuseki/fuseki-server --file=./data.ttl /ckg
```

## 📄 CSV to CKG Conversion

You can convert your curriculum data from a CSV to CKG. Please make sure your CSV follows our [template](https://docs.google.com/spreadsheets/d/1jWGtx_d5HgPSjE8JtJPH2kJTfbcoSYhI--RJdIwgtL0/edit?usp=sharing). 

📌 **Note**: When defining IDs, only use alphanumeric characters and underscores (`_`). Ensure uniqueness to prevent ambiguity.

### Instructions:
1. Navigate to `/addCourse.html`.
2. Follow the on-screen instructions to generate CKG.

## 🎯 Course Objective

To explore course objectives, head over to `/courseObjective.html`.

---
