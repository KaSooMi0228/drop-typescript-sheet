<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Dropsheet Diagnose</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css">
    <style>
        .metadata {
            display: flex;
        }
    </style>
  </head>
  <body class="content">
    <ul>
        <li>
            <a href="/log/0">First</a>
        </li>
        <li>
            <a href="/log/{{len(log) - 1}}">Last</a>
        </li>
    </ul>
  </body>
</html>
