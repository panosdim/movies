(function () {
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

    // Session check
    ajax.open('POST', 'php/session.php', true);
    ajax.send();
    ajax.onload = function () {
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
        source: function (term, response) {
            var ajax = new XMLHttpRequest();
            ajax.open('POST', 'php/autocomplete.php', true);
            ajax.send(JSON.stringify(term));
            ajax.onload = function () {
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
        onSelect: function (e, term) {
            btnSearch.classList.add('is-loading');
            var query = term.replace(/\(.*\)$/, '');
            search(query);
        }
    });

    // ----------------------------------------------
    // Event Listeners
    //-----------------------------------------------

    // Login
    btnLogin.addEventListener('click', function (event) {
        event.preventDefault();

        if (checkFormValidity(frmLogin)) {
            ajax.open('POST', 'php/login.php', true);

            ajax.send(new FormData(frmLogin));
            ajax.onload = function () {
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
    btnLogout.addEventListener('click', function () {
        ajax.open('POST', 'php/logout.php', true);
        ajax.send();
        ajax.onload = function () {
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
    btnSignUp.addEventListener('click', function () {
        mdlSignUp.classList.add('is-active');
    });

    // Modal close
    var modalButtons = document.querySelectorAll('.modal-card-head .delete, .modal-card-foot .button');
    var fnClose = function () {
        mdlSignUp.classList.remove('is-active');
    };
    for (var i = 0; i < modalButtons.length; i++) {
        modalButtons[i].addEventListener('click', fnClose);
    }

    // Register
    btnRegister.removeEventListener('click', fnClose);
    btnRegister.addEventListener('click', function (event) {
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
                ajax.onload = function () {
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
    btnSearch.addEventListener('click', function () {
        btnSearch.classList.add('is-loading');

        // If we have select something from autoComplete then we need to remove the date from the end
        if (document.querySelector('div.autocomplete-suggestion.selected') != null) {
            search(inpSearch.value.replace(/\(.*\)$/, ''));
        } else {
            search(inpSearch.value);
        }
    });
    inpSearch.addEventListener('keypress', function (event) {
        if (event.which == 13 || event.keyCode == 13) {
            // Search only if we don't have select anything from autoComplete
            if (document.querySelector('div.autocomplete-suggestion.selected') == null) {
                document.querySelector('div.autocomplete-suggestions').style.display = 'none';
                btnSearch.classList.add('is-loading');
                search(inpSearch.value);
                return false;
            }
        }
        return true;
    });

    // Clear Search Results
    btnClear.addEventListener('click', function () {
        sctResults.style.display = 'none';
        lstMovies.style.display = '';
        inpSearch.value = '';
    });

    // Add movie to watch list
    lstResults.addEventListener('click', function (e) {
        if (e.target && e.target.nodeName == "BUTTON") {
            var ajax = new XMLHttpRequest();
            var data = new FormData();
            data.append('title', e.target.dataset.title);
            data.append('overview', e.target.dataset.overview);
            data.append('image', e.target.dataset.image);

            ajax.open('POST', 'php/add.php', true);
            ajax.send(data);
            ajax.onload = function () {
                /**
                 * @type {{status: string, message: string}} resp
                 */
                var resp = {};
                if (this.status >= 200 && this.status < 400) {
                    // Success!
                    resp = JSON.parse(this.responseText);
                    if (resp.status == "success") {
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
    lstMovies.addEventListener('click', function (e) {
        if (e.target && e.target.nodeName == "BUTTON") {
            var ajax = new XMLHttpRequest();
            var data = new FormData();
            data.append('id', e.target.dataset.id);

            ajax.open('POST', 'php/delete.php', true);
            ajax.send(data);
            ajax.onload = function () {
                /**
                 * @type {{status: string, message: string}} resp
                 */
                var resp = {};
                if (this.status >= 200 && this.status < 400) {
                    // Success!
                    resp = JSON.parse(this.responseText);
                    if (resp.status == "success") {
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
        msgTimeout = setTimeout(function () {
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
        ajax.open('POST', 'php/get.php', true);
        ajax.send();
        ajax.onload = function () {
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

                if (resp.status == "success") {
                    var figure = HTMLElement;
                    var content = HTMLElement;
                    var media = HTMLElement;
                    var img = HTMLElement;
                    var title = HTMLElement;
                    var mediaRight = HTMLElement;
                    var button = HTMLElement;
                    var box = HTMLElement;
                    var grid = HTMLElement;
                    var column = HTMLElement;
                    var date = "";
                    var tag = "";

                    for (var i = 0; i < resp.data.length; i++) {
                        // Create grid
                        grid = document.createElement('div');
                        grid.classList.add('columns');

                        // Create column
                        column = document.createElement("div");
                        column.classList.add('column', 'is-10', 'is-offset-1');

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
                        img = document.createElement("img");
                        img.setAttribute('src', resp.data[i].image);
                        figure.appendChild(img);

                        // Create content div
                        content = document.createElement("div");
                        content.classList.add('media-content');
                        title = document.createElement("div");
                        title.classList.add('content');
                        // Check if we don't have a release date
                        if (resp.data[i].release_date == "0000-00-00") {
                            date = "Not Defined";
                            tag = "is-danger";
                        } else {
                            // Convert release date to Date object
                            var release_date = fecha.parse(resp.data[i].release_date, 'YYYY-MM-DD');
                            // Check if it is released or not
                            var today = new Date();
                            date = fecha.format(release_date, 'DD MMMM YYYY');
                            if (release_date.getTime() < today.getTime()) {
                                tag = "is-success";
                            } else {
                                tag = "is-warning";
                            }
                        }
                        // Append a text node to the cell
                        title.innerHTML = '<h1>' + resp.data[i].title +
                            '</h1><span class="tag is-medium ' + tag + '">' +
                            date +
                            '</span><br>' +
                            resp.data[i].overview;
                        content.appendChild(title);

                        // Create the delete button
                        mediaRight = document.createElement("div");
                        mediaRight.classList.add('media-right');
                        button = document.createElement("button");
                        button.classList.add('button', 'is-danger', 'delete');
                        button.dataset.id = resp.data[i].id;
                        mediaRight.appendChild(button);

                        // Add all to media div
                        media.appendChild(figure);
                        media.appendChild(content);
                        media.appendChild(mediaRight);

                        // Add media to box
                        box.appendChild(media);

                        // Add box to column
                        column.appendChild(box);

                        // Add column to grid
                        grid.insertBefore(column, grid.firstChild);

                        // Add to result list
                        if (tag == "is-danger") {
                            lstMovies.appendChild(grid);
                        } else {
                            lstMovies.insertBefore(grid, lstMovies.firstChild);
                        }
                    }
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
        ajax.open('POST', 'php/newReleases.php', true);
        ajax.send();
        ajax.onload = function () {
            /**
             * @typedef {Object} response
             * @property {{images: {base_url: string}}} conf
             * @property {{results[]: {poster_path:string, original_title: string, overview: string}}} releases
             * @type {response} resp
             */
            var resp = {};
            if (this.status >= 200 && this.status < 400) {
                // Success!
                resp = JSON.parse(this.responseText);
                var baseUrl = resp.conf.images.base_url + "w342";

                // Find all card elements and populate them
                var cards = sctNewReleases.querySelectorAll('.card');
                for (var i = 0; i < cards.length; i++) {
                    cards[i].getElementsByTagName('img')[0].setAttribute('src', baseUrl + resp.releases.results[i].poster_path);
                    cards[i].getElementsByTagName('h2')[0].innerText = resp.releases.results[i].original_title;
                    cards[i].getElementsByTagName('p')[0].innerText = resp.releases.results[i].overview;
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
        ajax.onload = function () {
            /**
             * @typedef {Object} response
             * @property {{images: {base_url: string}}} conf
             * @property {{movies[]: {poster_path:(string | null), original_title: string, overview: string}}} movies
             * @type {response} resp
             */
            var resp = {};

            if (this.status >= 200 && this.status < 400) {
                // Success!
                resp = JSON.parse(this.responseText);
                var baseUrl = resp.conf.images.base_url + "w92";

                var figure = HTMLElement;
                var content = HTMLElement;
                var media = HTMLElement;
                var img = HTMLElement;
                var title = HTMLElement;
                var mediaRight = HTMLElement;
                var button = HTMLElement;
                var box = HTMLElement;

                if (resp.movies.results.length == 0) {
                    lstResults.innerHTML = '<h2>Nothing found. Please search again.</h2>';
                }

                for (var i = 0; i < resp.movies.results.length; i++) {
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
                    img = document.createElement("img");
                    if (resp.movies.results[i].poster_path !== null) {
                        img.setAttribute('src', baseUrl + resp.movies.results[i].poster_path);
                    } else {
                        img.setAttribute('src', 'images/default-placeholder.png');
                    }
                    figure.appendChild(img);

                    // Create content div
                    content = document.createElement("div");
                    content.classList.add('media-content');
                    title = document.createElement("div");
                    title.classList.add('content');
                    // Append a text node to the cell
                    title.innerHTML = '<h1>' + resp.movies.results[i].original_title + '</h1><br>' + resp.movies.results[i].overview;
                    content.appendChild(title);

                    // Create the add button
                    mediaRight = document.createElement("div");
                    mediaRight.classList.add('media-right');
                    button = document.createElement("button");
                    button.classList.add('button', 'is-success');
                    button.innerText = 'Add to watchlist';
                    button.dataset.image = img.getAttribute('src');
                    button.dataset.title = resp.movies.results[i].original_title;
                    button.dataset.overview = resp.movies.results[i].overview;
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
        // Display progress bar
        prgUpdate.value = 0;
        prgUpdate.style.display = '';
        btnUpdate.classList.add('is-loading');

        //noinspection JSUnresolvedFunction
        var evtSource = new EventSource("php/update.php");

        evtSource.onmessage = function (e) {
            if (e.data !== 'FINISHED') {
                prgUpdate.value = e.data;
            } else {
                // Hide progress bar
                evtSource.close();
                prgUpdate.style.display = 'none';
                btnUpdate.classList.remove('is-loading');
            }
        }
    }
})();
