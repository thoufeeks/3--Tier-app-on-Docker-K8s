Docker dep:
docker compose up --build
docker exec -it <mysql_container_name> mysql -uroot -prootpass appdb
SELECT * FROM messages;

Deployment:

kubectl delete -f k8s/ --ignore-not-found
kubectl apply -f k8s/
kubectl rollout status deploy/mysql
kubectl rollout status deploy/backend
kubectl rollout status deploy/frontend
kubectl get svc frontend



Logs: 
kubectl logs deploy/backend --tail=120

Verification:-
kubectl exec -it deploy/mysql -- mysql -uroot -prootpass -e "USE appdb; SELECT * FROM messages;"
