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
      <div class="buttons">
        % if interesting_previous:
        <a class="button" href="/log/{{interesting_previous}}">Previous (i)</a>
        % end
        % if interesting_next:
        <a class="button" href="/log/{{interesting_next}}">Next (i)</a>
        % end
        % if index != 0:
        <a class="button" href="/log/{{index-1}}">Previous (all)</a>
        % end
        % if index + 1 != len(log):
        <a class="button" href="/log/{{index+1}}">Next (all)</a>
        % end
      </div>
      <pre>{{json}}</pre>
  </body>
</html>
