For development

```npm i -g live-server```
```live-server```

To upload to Bee

```tar -cf ../my_website.tar *```

```curl -X POST -H "Content-Type: application/x-tar" -H "Swarm-Index-Document: index.html" -H "Swarm-Error-Document: index.html" --data-binary @../my_website.tar http://localhost:8080/dirs```