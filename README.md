# Intelligent System – SVM-based Web Application

## Abstract
This project implements an **Intelligent System** that integrates a machine learning pipeline based on **Support Vector Machine (SVM)** with a modern web-based interface. The system is developed as a course project for the *Intelligent Systems* module at Ho Chi Minh City University of Technology (HCMUT). It demonstrates how data-driven intelligence can be exposed through RESTful APIs and visualized via a modern frontend.

The backend is implemented using **FastAPI**, providing endpoints for dataset management, exploratory data analysis, asynchronous model training, and experiment tracking. The frontend communicates with these APIs to enable dataset upload, preview, correlation analysis, and training control.

---

## 1. Introduction
Intelligent systems combine data processing, machine learning, and software engineering to support automated decision-making. In practical applications, such systems must not only provide accurate models but also offer usability, scalability, and transparency.

This project focuses on building a complete intelligent system pipeline, including:
- Dataset management
- Exploratory data analysis
- Machine learning training using SVM
- Experiment tracking and result visualization
- Integration between backend services and frontend interfaces

---

## 2. System Architecture
The system follows a **client–server architecture** consisting of three layers:

### 2.1 Presentation Layer (Frontend)
- Built with React, TypeScript, and Tailwind CSS
- Provides interfaces for uploading datasets, previewing data, visualizing correlations, and triggering model training
- Communicates with backend services via RESTful APIs

### 2.2 Application Layer (Backend)
- Implemented using FastAPI
- Handles HTTP requests from the frontend
- Manages datasets, analysis, and training workflows
- Supports asynchronous execution of training jobs

### 2.3 Intelligence Layer (Machine Learning)
- Uses Support Vector Machine (SVM)
- Handles training configuration, metrics computation, and result persistence
- Stores experiment metadata for later inspection

---

## 3. Technologies Used

### Backend
- Python 3.8 or later
- FastAPI
- Pydantic
- Pandas, NumPy
- Uvicorn

### Frontend
- TypeScript
- React
- Vite
- Tailwind CSS

### Tools
- Git & GitHub
- Node.js & npm

---

## 4. Project Structure

```
btl-he-thong-thong-minh/
│
├── server/
│   └── main.py              # FastAPI backend entry point
│
├── svm/
│   ├── inputs/              # Uploaded CSV datasets
│   └── outputs/             # Training metrics and run history
│       ├── metrics.json
│       └── runs.json
│
├── public/
│   └── samples/             # Sample static files
│
├── components/              # Reusable frontend components
├── views/                   # Frontend views/pages
├── styles/                  # Styling (Tailwind / CSS)
│
├── App.tsx
├── main.tsx
├── package.json
├── vite.config.ts
└── README.md
```

---

## 5. Backend API Specification

### 5.1 Dataset Management

#### Upload Dataset
- **Endpoint:** `POST /svm/datasets/upload`
- **Description:** Uploads a CSV dataset to the server

#### List Datasets
- **Endpoint:** `GET /svm/datasets/list.json`
- **Description:** Returns a list of available datasets

---

### 5.2 Data Exploration

#### Preview Dataset
- **Endpoint:** `GET /svm/preview`
- **Query Parameters:** `csv`, `head`
- **Description:** Returns column names and the first rows of the dataset

#### Correlation Heatmap
- **Endpoint:** `GET /svm/heatmap`
- **Description:** Computes the correlation matrix of numeric features

---

### 5.3 Model Training

#### Train Model
- **Endpoint:** `POST /svm/train`
- **Description:** Triggers asynchronous SVM training

#### List Training Runs
- **Endpoint:** `GET /svm/runs.json`
- **Description:** Returns historical training runs and metrics

---

## 6. Installation and Execution Guide

### 6.1 Prerequisites
- Python 3.8+
- Node.js 16+
- npm
- Git

### 6.2 Clone Repository
```bash
git clone https://github.com/NguyenKhanh1807/btl-he-thong-thong-minh.git
cd btl-he-thong-thong-minh
```

### 6.3 Backend Setup
```bash
pip install fastapi uvicorn pandas numpy
cd server
uvicorn main:app --reload
```

Backend available at:
```
http://127.0.0.1:8000
```
Swagger UI:
```
http://127.0.0.1:8000/docs
```

### 6.4 Frontend Setup
```bash
npm install
npm run dev
```
Frontend available at:
```
http://localhost:5173
```

---

## 7. Experimental Results
Each training run records:
- Accuracy
- F1-score
- Training parameters
- Timestamp

Results are stored in `svm/outputs/metrics.json` and `svm/outputs/runs.json`.

---

## 8. Limitations and Future Work
- Replace demo training logic with a full SVM implementation
- Add model persistence
- Support additional ML algorithms
- Improve scalability and performance
- Deploy system to cloud infrastructure

---

## 9. Conclusion
This project demonstrates the design and implementation of an intelligent system that integrates machine learning and web technologies. The modular backend and interactive frontend provide a strong foundation for future extensions.

---
