export default `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <title><%= title %></title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      .container {
        margin: auto;
        overflow: hidden;
        padding: 0 2rem;
        font-family: 'Georgia', sans-serif;
        font-size: 1rem;
        line-height: 1.6;
      }
      .large {
        font-size: 2rem;
        line-height: 1.2;
        margin-bottom: 1rem;
        color: blue;
      }
      .p {
        padding: 0.5rem;
      }
      .my-1 {
        margin: 1rem 0;
      }
      .lead {
        font-size: 1.5rem;
        margin-bottom: 1rem;
      }
    </style>
  </head>
  <body class="container">
    <h1>
      <%= greeting %>,
    </h1>
    <p class="p large">
      <%= opening %>
    </p>
    <p class="p lead">
      <%= prompt %>
      <a href="<%= link %>">
        <%= buttonText %>
      </a>
    </p>
    <p class="p lead">
      <%= closing %>
    </p>
  </body>
</html>`;
