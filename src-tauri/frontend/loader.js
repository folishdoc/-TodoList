var MAX_RETRIES = 30;
var retries = 0;

function showError(msg) {
    var el = document.getElementById('error-msg');
    if (el) {
        el.textContent = msg;
        el.style.display = 'block';
    }
}

function check() {
    retries++;
    fetch('http://localhost:18080/')
        .then(function(r) {
            if (r.ok) {
                window.location.href = 'http://localhost:18080';
                return;
            }
            retry();
        })
        .catch(function() {
            retry();
        });
}

function retry() {
    if (retries >= MAX_RETRIES) {
        showError('后端启动超时，请确认 Java 17+ 已安装并重试');
        return;
    }
    setTimeout(check, 1000);
}

check();
