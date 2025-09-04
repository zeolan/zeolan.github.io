(function () {
  document.addEventListener("DOMContentLoaded", function () {
    // var script = document.createElement("script");
    // script.src = "/assets/js/column_toggle.js";
    // document.body.appendChild(script);
    var token = localStorage.getItem("token");
    console.log("token: ", token);

    var param = /[&?]token=([^&]+)/.exec(location.search);
    param = param ? param[1].replace(/"/g, "&quot;") : "";
    console.log("param: ", param);
    console.log("param: ", location.search);
    if (param && param !== token && param.length === 16) {
      localStorage.setItem("token", param);
      console.log("Token updated");
      token = param;
    }
    if (token !== "0123456789012345") {
      console.log("Token invalid, hiding content");
      document.querySelectorAll(".post-content").forEach(function (cell) {
        //cell.style.display = "none";
        cell.innerHTML =
          '<p style="color: red; font-weight: bold; text-align: center; margin-top: 20px;">Нажаль, ви не маєте доступу до цієї сторінки. Звернитесь до адміністратора сайту</p>';
      });
    }
  });
})();
