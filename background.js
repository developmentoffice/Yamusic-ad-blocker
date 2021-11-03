const App = () => {
    const preffix = 'yamusic-ad-blocker'
    const PERIOD = 2000
    let isAdPlaying = false
    let interval = null

    const playCntrl = document.querySelector('.player-controls__btn_play')
    const play = () => playCntrl.dispatchEvent(new Event('click'))
    const playIfPause = () => (playCntrl.classList.contains('player-controls__btn_pause') === false ? play() : null)
    const sound = () => document.querySelector('.volume__btn').dispatchEvent(new Event('click'))
    const isAd = () => !!(document.querySelector('.audio-advert').classList.contains('audio-advert_hidden') === false && document.querySelector('.audio-advert__content').innerHTML.length > 0)
    const isPopup = () => {
        const popup = document.querySelector('.crackdown-popup')
        const overlay = document.querySelector('.deco-pane-overlay')
        return !!(popup && overlay && popup.classList.contains('popup_hidden') === false && overlay.classList.contains('overlay_shown') === true)
    }
    const now = () => new Intl.DateTimeFormat('ru', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }).format(new Date())
    const log = (msg) => console.log(`${preffix} ${now()}: ${msg}`)
    const actions = () => {
        if ((isAd() && !isAdPlaying) || (!isAd() && isAdPlaying)) {
            sound()
            isAdPlaying = !isAdPlaying
            if (!isAdPlaying) playIfPause()
            log(isAdPlaying ? 'Ad: Sound off' : 'Ad end: Sound on')
        }
        if (isPopup()) {
            const popup = document.querySelector('.crackdown-popup')
            const overlay = document.querySelector('.deco-pane-overlay')
            popup.classList.add('popup_hidden')
            overlay.classList.remove('overlay_shown')
            if (!isAdPlaying) playIfPause()
            log('Blocking popup: Close and start playing')
        }
    }
    const checkUrl = () => /^https:\/\/music.yandex.ru/.test(window.location.href)

    const sendStatus = () => {
        chrome.runtime.sendMessage({
            type: 'status',
            value: window.yaMusicAdBlockerStatus
        })
    }
    const start = () => {
        log('start')
        window.yaMusicAdBlockerInterval = setInterval(actions, PERIOD);
        window.yaMusicAdBlockerStatus = 'start'
        sendStatus()
    }
    const stop = () => {
        log('stop')
        clearInterval(window.yaMusicAdBlockerInterval)
        window.yaMusicAdBlockerStatus = 'stop'
        sendStatus()
    }

    if (!checkUrl()) {
        console.error(`${preffix} Extension works only on https://music.yandex.ru`)
        return
    } else {
        if (window.yaMusicAdBlockerStatus === 'start') stop()
        else start()
    }
}

chrome.action.onClicked.addListener((tab) => {
    const tabId = tab.id
    chrome.scripting.executeScript({
        target: {
            tabId
        },
        function: App
    })
    chrome.tabs.onMessage.addListener((msg) => {
        console.log(msg);
    })
})
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'status') {
        const path = message.value === 'start' ? 'icons/16.png' : 'icons/16-stop.png'
        const title = `Click to ${message.value === 'start' ? 'stop' : 'start'} blocking ad`
        chrome.action.setIcon({ path })
        chrome.action.setTitle({ title })
    }
})
