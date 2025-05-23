const form = document.getElementById("storyForm");
const entries = document.getElementById("journal-entries");

form.addEventListener("submit", function(e) {
  e.preventDefault();
  const text = form.querySelector("textarea").value;
  if (text.trim()) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerText = text.slice(0, 150) + (text.length > 150 ? "..." : "");
    entries.prepend(card);
    form.reset();
  }
});
