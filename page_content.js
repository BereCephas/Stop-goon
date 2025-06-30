
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
export default replace_page_content();

