let urls=[];
// retrieve porn websites urls from the json file
function get_urls() {
  return fetch(chrome.runtime.getURL('./urls.json'))
    .then(response => response.json())
    .then(data => {
      urls = data;
      check_current_url(); //once the data is retrieve,we start to check if the site visited
      //must be blocked
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
}

// replace the current page content with a message 
    function replace_page_content() {
      // html
      fetch(chrome.runtime.getURL("message/message.html"))
    .then(response => response.text())
    .then(html => {
      document.open();      
      document.write(html);   
      document.close();       
    })
    .catch(err => {
      console.error("Erreur lors du chargement de message.html :", err);
    });
    // css
    const link = document.createElement("link");
link.rel = "stylesheet";
link.type = "text/css";
link.href = chrome.runtime.getURL("message/message.css"); // chemin vers ton CSS

// Ajoute le lien dans le <head>
document.head.appendChild(link);
}

// get the url where the user is trying to visit
const current_url = window.location.href;

// fonction qui vérifie si l'url actuelle correspond à une des urls interdites
function check_current_url() {
   let matched = false;

  urls.forEach(element => {
    const urlObject = new URL(current_url);

    const domainMatch = urlObject.hostname.includes(element.domain);
    const pathMatch = element.path ? urlObject.pathname.includes(element.path) : true;

    if (domainMatch) {
      replace_page_content()
      matched = true;
    }
  });
}

// on lance tout
get_urls();
