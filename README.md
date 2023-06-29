![Pastebee](https://raw.githubusercontent.com/1up-digital/pastebee/master/assets/images/about-details.svg)

Roadmap

- code highlighting
- feeds
- collaborative editing?
- and more...

For development

```npm i -g live-server```
```live-server```

To upload to Bee

```tar -cf ../my_website.tar *```

```curl -X POST -H "Content-Type: application/x-tar" -H "Swarm-Index-Document: index.html" -H "Swarm-Error-Document: index.html" --data-binary @../my_website.tar http://localhost:8080/dirs```
