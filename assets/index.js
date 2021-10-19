const GATEWAY = 'https://bee-0.gateway.ethswarm.org'
const META_FILE_NAME = '.swarmgatewaymeta.json'

let h = window.location.href;
let parsedHash = h.split(h.match(/\?/),h.length)[1];

let hash, hasPaste, metadata, pasteText, url, showingAbout;

let baseHash;
let href = window.location.href.split('/');
if(href.indexOf('bzz') > -1){
     baseHash = href[4];
}

const shortenBytes = (value) => {
    if (value < 1e3) return `${value} bytes`

    if (value < 1e6) return `${(value / 1e3).toFixed(2)} kB`

    return `${(value / 1e6).toFixed(2)} MB`
}

let init = async () => {

    showAbout = false;

    if(typeof parsedHash === 'undefined'){
        hash = '';
        pasteText = '';
        url = '';
        hasPaste = false;
    }else{
        hash = parsedHash;
        url = window.location.href;
        hasPaste = true;
        await axios.get(GATEWAY + '/bzz/' + parsedHash).then((r_)=>{
            pasteText = r_.data;
            document.getElementById('texteditor').textContent = pasteText
        });

        // Fetch metadata file
        await axios.get(GATEWAY + '/bzz/' + parsedHash + '/' + META_FILE_NAME).then((r_)=>{
            metadata = r_.data;
        }).catch(e => {
            // If not found, than we ignore, otherwise at least propagate to console
            if ( !e.response || e.response.status !== 404) {
                console.error(e)
            }
        });
    }

    const router = new VueRouter({
      base: '/',
      mode: 'history',
      // routes: routes
    });

    Vue.filter('shortenBytes', shortenBytes)

    let app = new Vue({
        router: router,
        el: '#app',
        data: {
            metadata: metadata,
            hasPaste: hasPaste,
            pasteText: pasteText,
            showingAbout: showingAbout,
            hash: hash,
            url: url,
            gatewayLink: function(){
                return GATEWAY + '/bzz/' + this.hash
            }
        },
        methods: {
            clearPasteText: function(){
                this.pasteText = '';
            },
            createPaste: async function(){
                let formData = new FormData();
                // formData.append('pastebee.com.txt', this.pasteText);
                let response = await axios.post(GATEWAY + '/bzz?name=pastebee.com.txt', this.pasteText)
                this.hash = response.data.reference;
                this.hasPaste = true;
                document.getElementById('texteditor').textContent = this.pasteText
                let h_ = window.location.href.split('?')[0] + '?' + this.hash;
                this.url = h_;
                window.history.pushState({path:h_},'',h_);
                this.metadata = undefined
            },
            resetPaste: function(){
                this.pasteText = '';
                this.hasPaste = false;
                this.url = '';
            },
            copyUrl: function(){
                let el = document.getElementById('copy-input-1');
                el.select();
                document.execCommand('copy');
            },
            showAbout: function(){
                this.showingAbout = true;
            },
            hideAbout: function(){
                let contentEl = document.getElementById('about-content');
                let pageEl = document.getElementById('about-page');
                contentEl.classList.add('rotate-out-center');
                pageEl.classList.add('fade-out');
                setTimeout(()=>{
                    this.showingAbout = false;
                    contentEl.classList.remove('rotate-out-center');
                    pageEl.classList.remove('fade-out');
                }, 1000);

            },
            onInput: function(e){
                this.pasteText = e.target.innerText;

                console.log(this.pasteText)
            }
        },
        mounted: ()=>{
            setTimeout(()=>document.getElementById('app').classList.remove('loading'), 100);
        }
    });



};

init();
