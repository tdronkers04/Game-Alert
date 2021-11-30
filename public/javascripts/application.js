"use strict";

document.addEventListener("DOMContentLoaded", function () {
  let forms = document.querySelectorAll("form.delete");
  forms.forEach(form => {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      event.stopPropagation();

      if (confirm("Are you sure? This cannot be undone!")) {
        event.target.submit();
      }
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  let forms = document.querySelectorAll("form.deactivate");
  forms.forEach(form => {
    form.addEventListener("submit", function (event) {
      event.target.submit();
    });
  });
});