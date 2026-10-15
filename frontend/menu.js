/* =========================================
   HAMBURGER MENU
========================================= */

const menuButton =
    document.getElementById("menuButton");

const sideMenu =
    document.getElementById("sideMenu");

const closeMenu =
    document.getElementById("closeMenu");


/* =========================================
   OPEN MENU
========================================= */

menuButton.addEventListener(
    "click",
    function() {

        sideMenu.classList.add("active");

    }
);


/* =========================================
   CLOSE MENU
========================================= */

closeMenu.addEventListener(
    "click",
    function() {

        sideMenu.classList.remove("active");

    }
);


/* =========================================
   CLOSE AFTER CLICKING A PAGE
========================================= */

const menuLinks =
    document.querySelectorAll(
        ".menu-links a"
    );


menuLinks.forEach(function(link) {

    link.addEventListener(
        "click",
        function() {

            sideMenu.classList.remove(
                "active"
            );

        }
    );

});