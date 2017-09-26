(function() {
    "use strict";

    // ----------------------------------------------
    // Variables Declarations
    //-----------------------------------------------

    // DOM elements
    var btnClear = document.getElementById('btnClear');
    var btnLogin = document.getElementById('btnLogin');
    var btnLogout = document.getElementById('btnLogout');
    var btnRegister = document.getElementById('btnRegister');
    var btnSearch = document.getElementById('btnSearch');
    var btnSignUp = document.getElementById('btnSignUp');
    var btnTop = document.getElementById("btnTop");
    var btnUpdate = document.getElementById('btnUpdate');
    var frmLogin = document.getElementById('frmLogin');
    var frmRegister = document.getElementById('frmRegister');
    var inpSearch = document.getElementById('inpSearch');
    var logout = document.getElementById('logout');
    var lstMovies = document.getElementById('lstMovies');
    var lstResults = document.getElementById('lstResults');
    var mdlSignUp = document.getElementById('mdlSignUp');
    var ntfMdlMessage = document.getElementById('ntfMdlMessage');
    var ntfMessage = document.getElementById('ntfMessage');
    var prgUpdate = document.getElementById('prgUpdate');
    var sctResults = document.getElementById('sctResults');
    var sctMain = document.getElementById('sctMain');
    var sctNewReleases = document.getElementById('sctNewReleases');
    var sctNotification = document.getElementById('sctNotification');
    var signUp = document.getElementById('signUp');
    var welcome = document.getElementById('welcome');

    // Global Variables
    var ajax = new XMLHttpRequest();
    // Base URL of TMBd images
    var baseUrl = 'https://image.tmdb.org/t/p/';
    // Holds the previous timeout set from displayMessage function.
    var msgTimeout;
    /**
     * Holds basic information of the user.
     * @type {{loggedIn: boolean, userId: string, email: string}}
     */
    var user = {};

    // ----------------------------------------------
    // Initializations
    //-----------------------------------------------

    // Back to top button
    window.onscroll = function() {
        if (document.body.scrollTop > 750 || document.documentElement.scrollTop > 750) {
            btnTop.style.display = "block";
        } else {
            btnTop.style.display = "none";
        }
    };

    // Session check
    ajax.open('GET', 'php/session.php', true);
    ajax.send();
    ajax.onload = function() {
        if (this.status >= 200 && this.status < 400) {
            // Success!
            user = JSON.parse(this.responseText);

            if (user.loggedIn) {
                sctMain.style.display = '';
                sctNewReleases.style.display = 'none';
                frmLogin.parentNode.style.display = 'none';
                logout.style.display = '';
                signUp.style.display = 'none';
                welcome.innerText = 'Welcome ' + user.email;
                welcome.style.display = '';

                // Fetch watch list
                getWatchlist();
            } else {
                newReleases();
            }
        } else {
            // We reached our target server, but it returned an error
            displayMessage({
                'status': 'error',
                'message': 'Error contacting server.'
            });
        }
    };

    new autoComplete({
        selector: inpSearch,
        source: function(term, response) {
            try {
                ajax.abort();
            } catch (e) {
            }
            ajax.open('POST', 'php/autocomplete.php', true);
            ajax.send(JSON.stringify(term));
            ajax.onload = function() {
                if (this.status >= 200 && this.status < 400) {
                    // Success!
                    response(JSON.parse(this.responseText));
                } else {
                    // We reached our target server, but it returned an error
                    displayMessage({
                        'status': 'error',
                        'message': 'Error contacting server.'
                    });
                }
            };
        },
        renderItem: function(item, search) {
            search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            var re = new RegExp("(" + search.split(' ').join('|') + ")", "gi");
            var img = '<i class="fa fa-picture-o no_image_holder search" aria-hidden="true"></i>';
            if (item[2] !== null) {
                img = '<img width="45" height="67" src="' + item[2] + '">';
            }
            return '<div class="autocomplete-suggestion media" data-title="' + item[0] + '">' +
                '<figure class="image media-left">' + img + '</figure>' +
                '<div class="media-content"><div class="content">' +
                '<h4 class="title is-4">' + item[0].replace(re, "<b>$1</b>") + '</h4>' +
                '<h5 class="subtitle is-5">' + item[1] + '</h5>' +
                '</div></div></div>';
        },
        onSelect: function(e, term, item) {
            btnSearch.classList.add('is-loading');
            inpSearch.value = item.getAttribute('data-title');
            var query = item.getAttribute('data-title');
            search(query);
        }
    });

    // ----------------------------------------------
    // Event Listeners
    //-----------------------------------------------

    // Login
    btnLogin.addEventListener('click', function(event) {
        event.preventDefault();

        if (checkFormValidity(frmLogin)) {
            ajax.open('POST', 'php/login.php', true);

            ajax.send(new FormData(frmLogin));
            ajax.onload = function() {
                var resp = {};
                if (this.status >= 200 && this.status < 400) {
                    // Success!
                    resp = JSON.parse(this.responseText);

                    // Show message
                    displayMessage(resp);

                    if (resp.status === 'info') {
                        sctMain.style.display = '';
                        sctNewReleases.style.display = 'none';
                        frmLogin.parentNode.style.display = 'none';
                        logout.style.display = '';
                        signUp.style.display = 'none';
                        welcome.innerText = "Welcome " + resp.email;
                        welcome.style.display = '';

                        // Fetch watch list
                        getWatchlist();
                    }
                } else {
                    // We reached our target server, but it returned an error
                    displayMessage({
                        'status': 'error',
                        'message': 'Error contacting server.'
                    });
                }
            };
        }
    });

    // Logout
    btnLogout.addEventListener('click', function() {
        ajax.open('GET', 'php/logout.php', true);
        ajax.send();
        ajax.onload = function() {
            if (this.status >= 200 && this.status < 400) {
                // Success!
                displayMessage({
                    'status': 'info',
                    'message': 'Logged out successfully.'
                });
                sctMain.style.display = 'none';
                sctNewReleases.style.display = '';
                frmLogin.parentNode.style.display = '';
                logout.style.display = 'none';
                signUp.style.display = '';
                welcome.style.display = 'none';

                clearForm(frmLogin);
                newReleases();
            } else {
                // We reached our target server, but it returned an error
                displayMessage({
                    'status': 'error',
                    'message': 'Error contacting server.'
                });
            }
        };
    });

    // Sign Up
    btnSignUp.addEventListener('click', function() {
        mdlSignUp.classList.add('is-active');
    });

    // Modal close
    var modalButtons = document.querySelectorAll('.modal-card-head .delete, .modal-card-foot .button');
    var fnClose = function() {
        mdlSignUp.classList.remove('is-active');
    };
    for (var i = 0; i < modalButtons.length; i++) {
        modalButtons[i].addEventListener('click', fnClose);
    }

    // Register
    btnRegister.removeEventListener('click', fnClose);
    btnRegister.addEventListener('click', function(event) {
        event.preventDefault();
        ntfMdlMessage.style.display = 'none';

        if (checkFormValidity(frmRegister)) {
            // Check if passwords are match
            var password = document.getElementById('regPassword');
            var repeatPass = document.getElementById('regPasswordRepeat');
            if (password.value !== repeatPass.value) {
                password.classList.remove('is-success');
                password.classList.add('is-danger');
                repeatPass.classList.remove('is-success');
                repeatPass.classList.add('is-danger');
                ntfMdlMessage.innerHTML = "Passwords don't match";
                ntfMdlMessage.style.display = '';
            } else {
                ajax.open('POST', 'php/register.php', true);
                ajax.send(new FormData(frmRegister));
                ajax.onload = function() {
                    var resp = {};
                    if (this.status >= 200 && this.status < 400) {
                        // Success!
                        resp = JSON.parse(this.responseText);

                        if (resp.status === 'success') {
                            mdlSignUp.classList.remove('is-active');
                            clearForm(frmRegister);
                            // Show message
                            displayMessage(resp);
                        } else {
                            ntfMdlMessage.innerHTML = resp.message;
                            ntfMdlMessage.style.display = '';
                        }
                    } else {
                        // We reached our target server, but it returned an error
                        displayMessage({
                            'status': 'error',
                            'message': 'Error contacting server.'
                        });
                    }
                };
            }
        }
    });

    // Search
    btnSearch.addEventListener('click', function() {
        // Abort autocomplete search
        ajax.abort();
        btnSearch.classList.add('is-loading');
        search(inpSearch.value);
    });
    inpSearch.addEventListener('keypress', function(event) {
        if (event.which === 13 || event.keyCode === 13) {
            // Search only if we don't have select anything from autoComplete
            if (document.querySelector('div.autocomplete-suggestion.selected') === null) {
                ajax.abort();
                document.querySelector('div.autocomplete-suggestions').style.display = 'none';
                btnSearch.classList.add('is-loading');
                search(inpSearch.value);
                return false;
            }
        }
        return true;
    });

    // Clear Search Results
    btnClear.addEventListener('click', function() {
        sctResults.style.display = 'none';
        lstMovies.style.display = '';
        inpSearch.value = '';
    });

    // Add movie to watch list
    lstResults.addEventListener('click', function(e) {
        if (e.target && e.target.nodeName === "BUTTON") {
            e.target.classList.add('is-loading');
            var ajax = new XMLHttpRequest();
            var data = new FormData();
            data.append('title', e.target.dataset.title);
            data.append('overview', e.target.dataset.overview);
            data.append('image', e.target.dataset.image);
            data.append('year', e.target.dataset.year);

            ajax.open('POST', 'php/add.php', true);
            ajax.send(data);
            ajax.onload = function() {
                /**
                 * @type {{status: string, message: string}} resp
                 */
                var resp = {};
                if (this.status >= 200 && this.status < 400) {
                    // Success!
                    e.target.classList.remove('is-loading');
                    resp = JSON.parse(this.responseText);
                    if (resp.status === "success") {
                        sctResults.style.display = 'none';
                        lstMovies.style.display = '';
                        inpSearch.value = '';
                        getWatchlist();
                    }
                    displayMessage(resp);
                } else {
                    // We reached our target server, but it returned an error
                    displayMessage({
                        'status': 'error',
                        'message': 'Error contacting server.'
                    });
                }
            };
        }
    });

    // Delete movie from watchlist
    lstMovies.addEventListener('click', function(e) {
        var btnDelete = e.target.closest("a.watched");
        if (e.target && btnDelete) {
            var ajax = new XMLHttpRequest();
            var data = new FormData();
            data.append('id', btnDelete.dataset.id);

            ajax.open('POST', 'php/delete.php', true);
            ajax.send(data);
            ajax.onload = function() {
                /**
                 * @type {{status: string, message: string}} resp
                 */
                var resp = {};
                if (this.status >= 200 && this.status < 400) {
                    // Success!
                    resp = JSON.parse(this.responseText);
                    if (resp.status === "success") {
                        getWatchlist();
                    }
                    displayMessage(resp);
                } else {
                    // We reached our target server, but it returned an error
                    displayMessage({
                        'status': 'error',
                        'message': 'Error contacting server.'
                    });
                }
            };
        }
    });

    // Update release dates of undefined movies in watchlist
    btnUpdate.addEventListener('click', updateWatchlist);

    // Back to top
    btnTop.addEventListener('click', function() {
        document.body.scrollTop = 0; // For Chrome, Safari and Opera
        document.documentElement.scrollTop = 0; // For IE and Firefox
    });

    // Hide or show movies sections
    document.addEventListener('click', function(e) {
        var elm = e.target;
        if (elm && elm.tagName.toLowerCase() === 'i' && elm.hasAttribute('caret')) {
            var container = elm.parentNode.parentNode.parentNode;
            if (container && container.tagName.toLowerCase() === 'div' && container.classList.contains('container')) {
                var movies = container.querySelectorAll('div.columns');
            }
            var i = 0, len = movies.length;

            if (elm.classList.contains('fa-caret-down')) {
                // Hide movies
                for (; i < len; i++) {
                    movies[i].style.display = 'none';
                }
                elm.classList.remove('fa-caret-down');
                elm.classList.add('fa-caret-right');
            } else {
                // Show movies
                for (; i < len; i++) {
                    movies[i].style.display = '';
                }
                elm.classList.remove('fa-caret-right');
                elm.classList.add('fa-caret-down');
            }
        }
    });

    // ----------------------------------------------
    // Functions
    //-----------------------------------------------

    /**
     * Check a form for valid inputs.
     * @param {object} form A HTML form element.
     *
     * @return {boolean} True if form is valid else false.
     */
    function checkFormValidity(form) {
        var i, valid, validInput, invalidInput;

        valid = form.checkValidity();
        if (valid) {
            // Clear validity marks from input elements
            validInput = form.querySelectorAll('input:valid');
            for (i = 0; i < validInput.length; i++) {
                validInput[i].classList.remove('is-danger');
                validInput[i].classList.add('is-success');
            }
        } else {
            // Set validity class in input elements
            invalidInput = form.querySelectorAll('input:invalid');
            for (i = 0; i < invalidInput.length; i++) {
                invalidInput[i].classList.add('is-danger');
            }
            validInput = form.querySelectorAll('input:valid');
            for (i = 0; i < validInput.length; i++) {
                validInput[i].classList.remove('is-danger');
                validInput[i].classList.add('is-success');
            }
        }

        return valid;
    }

    /**
     * Clear form input fields and validity marks.
     *
     * @param {object} form A HTML form element.
     * @param {boolean} [reset=false] Indicates if form reset must be performed.
     */
    function clearForm(form, reset) {
        reset = reset === undefined ? false : reset;
        var i, invalidInput, validInput;

        // Set validity class in input elements
        invalidInput = form.querySelectorAll('input:invalid');
        for (i = 0; i < invalidInput.length; i++) {
            invalidInput[i].classList.remove('is-danger');
        }
        validInput = form.querySelectorAll('input:valid');
        for (i = 0; i < validInput.length; i++) {
            validInput[i].classList.remove('is-success');
        }

        if (reset) {
            form.reset();
        }
    }

    /**
     * Display a message to inform user about some operations.
     * It changes the message color according to result.
     *
     * @param {object} result The json encoded result of the operation.
     * @param {string} result.message Message text.
     * @param {string} result.status The type of message.
     */
    function displayMessage(result) {
        // Clear previous notification
        ntfMessage.innerHTML = '<button class="delete"></button>';

        // Modify notification according to message type
        switch (result.status) {
            case 'info':
                ntfMessage.classList.add('is-primary');
                ntfMessage.classList.remove('is-success');
                ntfMessage.classList.remove('is-danger');
                break;
            case 'success':
                ntfMessage.classList.add('is-success');
                ntfMessage.classList.remove('is-primary');
                ntfMessage.classList.remove('is-danger');
                break;
            case 'error':
                ntfMessage.classList.add('is-danger');
                ntfMessage.classList.remove('is-success');
                ntfMessage.classList.remove('is-primary');
                break;
        }

        // Add the message element
        ntfMessage.innerHTML = result.message;

        // Show message
        sctNotification.style.display = '';

        // Remove previous message
        clearTimeout(msgTimeout);

        // After 3 seconds, hide the notification
        msgTimeout = setTimeout(function() {
            sctNotification.style.display = 'none';
        }, 3000);
    }

    /**
     * Return the current watch list movies
     */
    function getWatchlist() {
        // Clear result list
        while (lstMovies.firstChild) {
            lstMovies.removeChild(lstMovies.firstChild);
        }

        var ajax = new XMLHttpRequest();
        ajax.open('GET', 'php/get.php', true);
        ajax.send();
        ajax.onload = function() {
            /**
             * @typedef {Object} Response
             * @property {string} status - Indicates the status of the operation.
             * @property {string} [message] - Indicates the message of the operation.
             * @property {Object[]} [data] - The return data of the operation.
             * @property {int} data.id - The id of the movie.
             * @property {string} data.title - The title of the movie.
             * @property {string} data.overview - The overview of the movie.
             * @property {string} data.image - The poster image of the movie.
             * @property {string} data.release_date - The dvd release date of the movie.
             * @type {Response} resp
             */
            var resp = {};

            if (this.status >= 200 && this.status < 400) {
                // Success!
                resp = JSON.parse(this.responseText);

                if (resp.status === "success") {
                    // Create sections
                    var sctReleased;
                    var sctComing;
                    var sctUnknown;

                    sctReleased = document.createElement('section');
                    sctReleased.classList.add('section');
                    sctComing = document.createElement('section');
                    sctComing.classList.add('section');
                    sctUnknown = document.createElement('section');
                    sctUnknown.classList.add('section');

                    // Create containers
                    var cntReleased;
                    var cntComing;
                    var cntUnknown;

                    cntReleased = document.createElement('div');
                    cntReleased.classList.add('container');
                    cntComing = document.createElement('div');
                    cntComing.classList.add('container');
                    cntUnknown = document.createElement('div');
                    cntUnknown.classList.add('container');

                    // Create title
                    var hdrReleased;
                    var hdrComing;
                    var hdrUnknown;

                    hdrReleased = document.createElement('h1');
                    hdrReleased.classList.add('title');
                    hdrReleased.innerHTML = '<span class="icon is-medium"><i caret class="fa fa-caret-down"></i></span> Released on DVD';
                    hdrComing = document.createElement('h1');
                    hdrComing.classList.add('title');
                    hdrComing.innerHTML = '<span class="icon is-medium"><i caret class="fa fa-caret-down"></i></span> Coming Soon';
                    hdrUnknown = document.createElement('h1');
                    hdrUnknown.classList.add('title');
                    hdrUnknown.innerHTML = '<span class="icon is-medium"><i caret class="fa fa-caret-down"></i></span> Unknown Release Date';

                    // Add title to container
                    cntReleased.appendChild(hdrReleased);
                    cntReleased.appendChild(document.createElement('hr'));
                    cntComing.appendChild(hdrComing);
                    cntComing.appendChild(document.createElement('hr'));
                    cntUnknown.appendChild(hdrUnknown);
                    cntUnknown.appendChild(document.createElement('hr'));

                    // Counters for each section
                    var nrReleased = 0;
                    var nrComing = 0;
                    var nrUnknown = 0;

                    // Card Elements
                    var card = HTMLElement;
                    var cardContent = HTMLElement;
                    var cardImage = HTMLElement;
                    var cardHeader = HTMLElement;
                    var cardTitle = HTMLElement;
                    var button = HTMLElement;
                    var releaseDate = HTMLElement;
                    var figure = HTMLElement;
                    var img = HTMLElement;
                    var grid = HTMLElement;
                    var column = HTMLElement;
                    var date = "";
                    var tag = "";
                    var imageUrl = baseUrl + "w185";

                    for (var i = 0; i < resp.data.length; i++) {
                        var nrGrid = 0;
                        var cntGrid = undefined;

                        // Check if we don't have a release date
                        if (resp.data[i].release_date === "0000-00-00") {
                            date = "Not Defined";
                            tag = "is-danger";
                            nrGrid = nrUnknown;
                            nrUnknown++;
                            cntGrid = cntUnknown;
                        } else {
                            // Convert release date to Date object
                            var release_date = fecha.parse(resp.data[i].release_date, 'YYYY-MM-DD');
                            // Check if it is released or not
                            var today = new Date();
                            date = fecha.format(release_date, 'DD MMMM YYYY');
                            if (release_date.getTime() < today.getTime()) {
                                tag = "is-success";
                                nrGrid = nrReleased;
                                nrReleased++;
                                cntGrid = cntReleased;
                            } else {
                                tag = "is-warning";
                                nrGrid = nrComing;
                                nrComing++;
                                cntGrid = cntComing;
                            }
                        }
                        if (nrGrid % 6 === 0) {
                            // Create grid
                            grid = document.createElement('div');
                            grid.classList.add('columns');
                        }

                        // Create column
                        column = document.createElement("div");
                        column.classList.add('column', 'is-2');

                        // Create card
                        card = document.createElement("div");
                        card.classList.add('card');

                        // Create card image div
                        cardImage = document.createElement("div");
                        cardImage.classList.add('card-image');

                        // Create the delete button
                        button = document.createElement("a");
                        button.classList.add('watched', 'button', 'is-danger');
                        button.dataset.id = resp.data[i].id;
                        button.innerHTML = '<span class="icon"><i class="fa fa-trash-o"></i></span>';
                        card.appendChild(button);

                        // Create figure
                        figure = document.createElement("figure");
                        figure.classList.add('image');
                        // Add image to figure
                        if (resp.data[i].image !== null) {
                            img = document.createElement("img");
                            img.setAttribute('src', imageUrl + resp.data[i].image);
                        } else {
                            img = document.createElement("i");
                            img.classList.add('fa', 'fa-picture-o', 'no_image_holder', 'card');
                        }
                        figure.appendChild(img);

                        // Add figure to card-image
                        cardImage.appendChild(figure);

                        // Create card header
                        cardHeader = document.createElement("header");
                        cardHeader.classList.add('card-header');
                        cardTitle = document.createElement("h6");
                        cardTitle.classList.add('card-header-title');
                        cardTitle.innerHTML = resp.data[i].title;

                        // Add cardTitle to cardHeader
                        cardHeader.appendChild(cardTitle);

                        // Create content div
                        cardContent = document.createElement("div");
                        cardContent.classList.add('card-content');

                        // Create release date tag
                        releaseDate = document.createElement("div");
                        releaseDate.classList.add('has-text-centered');
                        // Append a text node to the cell
                        releaseDate.innerHTML = '<span class="tag ' + tag + '">' +
                            date +
                            '</span>';

                        // Append level in card footer
                        cardContent.appendChild(releaseDate);

                        // Add all to card
                        card.appendChild(cardImage);
                        card.appendChild(cardHeader);
                        card.appendChild(cardContent);

                        // Add card to column
                        column.appendChild(card);

                        // Add column to grid
                        grid.appendChild(column);

                        // Add to result list
                        if (nrGrid % 6 === 0) {
                            cntGrid.appendChild(grid);
                        }
                    }

                    // Update header titles
                    hdrReleased.innerHTML = hdrReleased.innerHTML + ' (' + nrReleased + ')';
                    hdrComing.innerHTML = hdrComing.innerHTML + ' (' + nrComing + ')';
                    hdrUnknown.innerHTML = hdrUnknown.innerHTML + ' (' + nrUnknown + ')';

                    // Add Containers to sections
                    sctReleased.appendChild(cntReleased);
                    sctComing.appendChild(cntComing);
                    sctUnknown.appendChild(cntUnknown);

                    // Add sections to lstMovies
                    lstMovies.appendChild(sctReleased);
                    lstMovies.appendChild(sctComing);
                    lstMovies.appendChild(sctUnknown);

                    // Hide section with Unknown Release Date
                    hdrUnknown.getElementsByTagName('i')[0].click();
                } else {
                    displayMessage(resp);
                }
            } else {
                // We reached our target server, but it returned an error
                displayMessage({
                    'status': 'error',
                    'message': 'Error contacting server.'
                });
            }
        };
    }

    /**
     * Return popular movies of current time and populate four card elements
     */
    function newReleases() {
        var ajax = new XMLHttpRequest();
        ajax.open('GET', 'php/newReleases.php', true);
        ajax.send();
        ajax.onload = function() {
            /**
             * @type {{results[]: {poster_path:string, original_title: string, overview: string}}} resp
             */
            var resp = {};
            if (this.status >= 200 && this.status < 400) {
                // Success!
                resp = JSON.parse(this.responseText);
                var imageUrl = baseUrl + "w342";

                // Find all card elements and populate them
                var cards = sctNewReleases.querySelectorAll('.card');
                for (var i = 0; i < cards.length; i++) {
                    cards[i].getElementsByTagName('img')[0].setAttribute('src', imageUrl + resp.results[i].poster_path);
                    cards[i].getElementsByTagName('h2')[0].innerText = resp.results[i].original_title;
                    cards[i].getElementsByTagName('p')[0].innerText = resp.results[i].overview;
                }
            } else {
                // We reached our target server, but it returned an error
                displayMessage({
                    'status': 'error',
                    'message': 'Error contacting server.'
                });
            }
        };
    }

    /**
     * Search for movies in TMDb
     * @param {string} query The search string
     */
    function search(query) {
        // Get the already added movies
        var movies = lstMovies.getElementsByTagName('h6');

        // Clear result list
        while (lstResults.firstChild) {
            lstResults.removeChild(lstResults.firstChild);
        }
        // Show result section and hide movies list
        sctResults.style.display = '';
        lstMovies.style.display = 'none';

        var ajax = new XMLHttpRequest();
        ajax.open('POST', 'php/search.php', true);
        ajax.send(JSON.stringify(query));
        ajax.onload = function() {
            /**
             * @type {{results[]: {poster_path:(string | null), original_title: string, overview: string}}} resp
             */
            var resp = {};

            if (this.status >= 200 && this.status < 400) {
                // Success!
                resp = JSON.parse(this.responseText);
                var imageUrl = baseUrl + "w92";

                var figure = HTMLElement;
                var content = HTMLElement;
                var media = HTMLElement;
                var img = HTMLElement;
                var title = HTMLElement;
                var mediaRight = HTMLElement;
                var button = HTMLElement;
                var box = HTMLElement;

                if (resp.results.length === 0) {
                    lstResults.innerHTML = '<h2>Nothing found. Please search again.</h2>';
                }

                for (var i = 0; i < resp.results.length; i++) {
                    // Create box
                    box = document.createElement("div");
                    box.classList.add('box');

                    // Create media div
                    media = document.createElement("div");
                    media.classList.add('media');

                    // Create figure
                    figure = document.createElement("figure");
                    figure.classList.add('media-left');
                    // Add image to figure
                    if (resp.results[i].poster_path !== null) {
                        img = document.createElement("img");
                        img.setAttribute('src', imageUrl + resp.results[i].poster_path);
                    } else {
                        img = document.createElement("i");
                        img.classList.add('fa', 'fa-picture-o', 'no_image_holder', 'w92_and_h138');
                    }
                    figure.appendChild(img);

                    // Create content div
                    content = document.createElement("div");
                    content.classList.add('media-content');
                    title = document.createElement("div");
                    title.classList.add('content');
                    // Append a text node to the cell
                    title.innerHTML = '<p class="title is-3">' + resp.results[i].original_title + '</p>' +
                        '<p class="subtitle is-5">' + resp.results[i].release_date + '</p>' +
                        '<br>' +
                        resp.results[i].overview;
                    content.appendChild(title);

                    var found = Array.from(movies).find(function (movie) {
                        return movie.innerHTML === this.original_title;
                    }, resp.results[i]);

                    // Check if movie is already added in watchlist
                    if (found) {
                        // Create the add button
                        button = document.createElement("button");
                        button.classList.add('button', 'is-info', 'is-outlined');
                        button.innerText = 'Already added to watchlist';
                        button.setAttribute("disabled", "");
                    } else {
                        // Create the add button
                        button = document.createElement("button");
                        button.classList.add('button', 'is-success');
                        button.innerText = 'Add to watchlist';
                        button.dataset.image = resp.results[i].poster_path;
                        button.dataset.title = resp.results[i].original_title;
                        button.dataset.overview = resp.results[i].overview;
                        if (resp.results[i].release_date === '')
                            continue;
                        button.dataset.year = fecha.format(fecha.parse(resp.results[i].release_date, 'YYYY-MM-DD'), 'YYYY');
                    }

                    // Create the media right div
                    mediaRight = document.createElement("div");
                    mediaRight.classList.add('media-right');
                    mediaRight.appendChild(button);

                    // Add all to media div
                    media.appendChild(figure);
                    media.appendChild(content);
                    media.appendChild(mediaRight);

                    // Add media to box
                    box.appendChild(media);

                    // Add to result list
                    lstResults.appendChild(box);
                }
            } else {
                // We reached our target server, but it returned an error
                displayMessage({
                    'status': 'error',
                    'message': 'Error contacting server.'
                });
            }

            // Remove loading class from search button
            btnSearch.classList.remove('is-loading');
        };
    }

    /**
     * Update release date for movies that is not defined
     */
    function updateWatchlist() {
        var pollTimeout;
        prgUpdate.value = 0;
        prgUpdate.style.display = '';
        btnUpdate.classList.add('is-loading');

        var ajax = new XMLHttpRequest();
        ajax.open('GET', 'php/update.php', true);
        ajax.send();
        ajax.onload = function() {
            /**
             * @type {{status: string, message: string}} resp
             */
            var resp = {};
            if (this.status >= 200 && this.status < 400) {
                // Success!
                prgUpdate.value = 100;
                clearTimeout(pollTimeout);
                resp = JSON.parse(this.responseText);
                prgUpdate.style.display = 'none';
                btnUpdate.classList.remove('is-loading');
                displayMessage(resp);
                getWatchlist();
            } else {
                // We reached our target server, but it returned an error
                displayMessage({
                    'status': 'error',
                    'message': 'Error contacting server.'
                });
            }
        };

        (function poll() {
            pollTimeout = setTimeout(function() {
                var ajax = new XMLHttpRequest();
                ajax.open('GET', 'php/progress.php', true);
                ajax.send();
                ajax.onload = function() {
                    if (this.status >= 200 && this.status < 400) {
                        // Success!
                        //Update progress bar
                        prgUpdate.value = this.responseText;

                        //Setup the next poll recursively
                        poll();
                    } else {
                        // We reached our target server, but it returned an error
                        displayMessage({
                            'status': 'error',
                            'message': 'Error contacting server.'
                        });
                    }
                };
            }, 2000);
        })();
    }
})();
