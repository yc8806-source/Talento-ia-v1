SELECT e.id, e.candidate_vacancy_id, e.exam_id, e.access_token, e.status
FROM evaluations e
WHERE e.candidate_vacancy_id = 113
ORDER BY e.created_at DESC
LIMIT 20;
