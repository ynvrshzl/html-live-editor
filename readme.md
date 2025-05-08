# How does it work?
The editor uses my [virtual file system]() to build web content. Simply import a json database with the correct [schema](#schema).

# Schema
The schema is pretty simple & powerful for scaling! An array of objects. Each object is a 'file' which allows for any number of custom properties.

```json
[
    {
        "id": 1234,
        "content": ""
    }, 
    {
        "id": 1234,
        "content": ""
    }, 
    {
        "id": 1234,
        "content": ""
    }
]
```