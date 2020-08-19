let app = new Vue({
    el: '#app',
    data: {
      pasteText: 'Hello Vue!',
      hash: ''
    },
    methods: {
        clearPasteText: function(){
            this.pasteText = '';
        },
        createPaste: async function(){
            let formData = new FormData();
            formData.append('pastebee.com.txt', this.pasteText);
            let response = await axios.post('http://localhost:8083/files', formData, {
                headers: {
                  'Content-Type': 'text/plain'
                }
            });
            this.hash = response.data.reference
        }
    }
});