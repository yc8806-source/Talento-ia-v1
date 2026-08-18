#!/bin/bash

API="http://localhost:3000/api"

echo "1. Creating vacancy..."
VACANCY=$(curl -s -X POST "$API/vacancies" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Vacancy '$(date +%s)'",
    "description": "Auto-created test vacancy"
  }')
VACANCY_ID=$(echo $VACANCY | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
echo "   Vacancy ID: $VACANCY_ID"

echo "2. Creating candidate..."
CANDIDATE=$(curl -s -X POST "$API/candidates" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Candidate '$(date +%s)'",
    "email": "test-'$(date +%s)'@example.com",
    "phone": "+1234567890"
  }')
CANDIDATE_ID=$(echo $CANDIDATE | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
echo "   Candidate ID: $CANDIDATE_ID"

echo "3. Assigning candidate to vacancy..."
CV=$(curl -s -X POST "$API/candidate-vacancies" \
  -H "Content-Type: application/json" \
  -d '{
    "candidateId": '${CANDIDATE_ID}',
    "vacancyId": '${VACANCY_ID}',
    "exams": [29]
  }')
TOKEN=$(echo $CV | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "   Token: $TOKEN"

echo ""
echo "✅ Test candidate created successfully!"
echo "URL: http://localhost:3001/evaluacion?token=$TOKEN"
