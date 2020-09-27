let gateway = 'http://localhost:8082'
let h = window.location.href;
let r = h.split(h.match(/\?/),h.length)[1];

let hash, hasPaste, pasteText;

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

    let app = new Vue({
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
                let h_ = window.location.protocol + '//' + window.location.host + '/?' + this.hash;
                window.history.pushState({path:h_},'',h_);
            },
            resetPaste: function(){
                this.pasteText = '';
                this.hasPaste = false;
            }
        }
    });

};

init();