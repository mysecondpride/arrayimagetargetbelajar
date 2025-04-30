document.addEventListener("DOMContentLoaded", function () {
  const allButtons = document.querySelectorAll(".searchBtn");
  const searchBar = document.querySelector(".searchBar");
  const searchInput = document.getElementById(".searchInput");
  const searchClose = document.getElementById(".searchClose ");

  for (var i = 0; i < allButtons.length; i++) {
    allButtons[i].addEventListener("click", function () {
      searchBar.style.visibility = "visible";
      searchBar.classList.add("open");
      this.setAttribute("aria-expanded", "true");
      searchInput.focus();
    });
  }
});

// 1. Ambil ID dari URL (misal: https://example.com/post/123 → id=123)
const pathSegments = window.location.pathname.split("/"); // ["", "post", "123"]
const postId = pathSegments[2]; // "123"

// 2. Bangun URL lengkap untuk share (termasuk ID)
// const currentUrl = window.location.href; // atau sesuaikan jika perlu
const currentUrl = `https://localhost:5000/post/${postId}`;

// 3. Dapatkan tombol share
const facebookBtn = document.querySelector(".facebook-btn");

// 4. Update link share dengan URL yang mengandung ID
if (postId) {
  // Share Facebook
  facebookBtn.onclick = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        currentUrl
      )}`,
      "_blank"
    );
  };
}
