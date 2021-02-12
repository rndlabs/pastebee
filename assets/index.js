let gateway = 'https://bee-gateway.duckdns.org'
let h = window.location.href;
let r = h.split(h.match(/\?/),h.length)[1];

let loaded,hash, hasPaste, pasteText;

let baseHash;
let href = window.location.href.split('/');
if(href.indexOf('bzz') > -1){
    baseHash = href[4];
}

let init = async () => {

    if(typeof r === 'undefined'){
        hash = '';
        pasteText = '';
        hasPaste = false;
    }else{
        hash = r;
        hasPaste = true;
        await axios.get(gateway + '/files/' + r).then((r_)=>{
            pasteText = r_.data;
        });
    }

    const About = { template: '<div id="about-text">Pastebee is powered by Bee - the client to access the Swarm network.</div>' }

    const routes = [
      { path: '/about', component: About },
    ]

    const router = new VueRouter({
      base: '/bzz/' + baseHash,
      mode: 'history',
      routes: routes
    });

    let app = new Vue({
        router: router,
        el: '#app',
        data: {
            hasPaste: hasPaste,
            pasteText: pasteText,
            hash: hash,
            gatewayLink: function(){
                return gateway + '/files/' + this.hash 
            } 
        },
        methods: {
            clearPasteText: function(){
                this.pasteText = '';
            },
            createPaste: async function(){
                let formData = new FormData();
                formData.append('pastebee.com.txt', this.pasteText);
                let response = await axios.post(gateway + '/files', formData, {
                    headers: {
                      'Content-Type': 'text/plain'
                    }
                });
                this.hash = response.data.reference;
                this.hasPaste = true;
                let h_ = window.location.href + '?' + this.hash;
                window.history.pushState({path:h_},'',h_);
            },
            resetPaste: function(){
                this.pasteText = '';
                this.hasPaste = false;
            }
        },
        mounted: ()=>{
            setTimeout(()=>document.getElementById('app').classList.remove('loading'), 100);
        }
    });



};

init();