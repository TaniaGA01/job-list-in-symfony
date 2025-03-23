import { Controller } from '@hotwired/stimulus';

export default class extends Controller {

    static targets = ['offers', 'prototype', 'paginationBtn', 'spinner', 'searchInput', 'searchBtn', 'searchError', 'resetBtn', 'message']
    static values = {
        token:String,
        cities:Array,
        citiesDetails:Array
    }

    connect() { this.getToken(); }

    /**
     * Fonction permettant obtenir le token d'accès à l'api
     */
    async getToken(){
        try {
            let getAccessToken = await fetch(`/get-token`);

            let response = await getAccessToken.json();
            this.token = response.token;

        } catch (error) {
            console.log('error', error)
        }
    }

    /**
     * Fonction permettant obtenir les données de l'api
     * @param { string } token
     * @param { number } page
     */
    async getOffres(token, page){
        const limit = 10;
        try {
            const 
                start = (page - 1) * limit,
                end = start + limit - 1
            ;
    
            let response = await fetch(
                `https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search?range=${start}-${end}`, 
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }  
                }
            );
            const data = await response.json();
            this.createOfferCard(data.resultats)
        } catch (error) {
            console.error('Error au moment de récupérer les offres:', error);
        }
    };

    /**
     * Fonction permettant afficher les données dans le front
     * @param { Array } data
     */
    createOfferCard(data){
        [...data].forEach(resultat =>{
            const 
                offerBlockParent = this.prototypeTarget.firstElementChild,
                offerBlock = offerBlockParent.cloneNode(true),
                title = offerBlock.querySelector('#offreTitle'),
                description = offerBlock.querySelector('#offreDescription'),
                location = offerBlock.querySelector('#offreLocation'),
                entreprise = offerBlock.querySelector('#entrepriseName')
            ;
            title.innerText = resultat.intitule;
            if(resultat.lieuTravail !== undefined){
                location.innerText = resultat.lieuTravail.libelle;
            }
            entreprise.innerText = resultat.entreprise.nom;
            description.innerText = resultat.description;
            offerBlock.classList.remove('hidden');

            this.offersTarget.append(offerBlock);
        })
        this.spinnerTarget.classList.add('hidden');
    }

    /**
     * Fonction permettant afficher les offres
     */
    displayOffers(){
        this.spinnerTarget.classList.remove('hidden');
        
        let 
            lastPage = this.offersTarget.dataset.page,
            currentPage = Number(lastPage)
        ;
        this.offersTarget.dataset.page = String(currentPage + 1);
        this.getOffres(this.token, currentPage).then()
    }

    /**
     * Fonction permettant de filtrer ls offres par commune en utilisant l'api des communes du .gouv
     */
    async filterOffers(){
        if(this.searchInputTarget.value !== ''){
            try{
                let response = await fetch(`https://geo.api.gouv.fr/communes?nom=${this.searchInputTarget.value}`);
                let citiesAnswer = await response.json();

                if(citiesAnswer.length === 0){
                    this.searchErrorTarget.classList.remove('hidden');
                }else{
                    this.cities = citiesAnswer;
                    this.synchroLocations();
                }
                
            }catch(error){
                console.log('error', error)
            }
        }else{
            this.spinnerTarget.classList.remove('hidden');
        }
    }

    /**
     * Fonction permettant synchroniser les deux points api
     */
    async synchroLocations(){
        try{
            let place = await fetch(`https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    }  
                }
            );
            let offers = await place.json();
            let citiesDetails = [];
            [...offers.resultats].forEach(offer => {
                    [...this.cities].forEach(city => {
                    if(offer.lieuTravail !== undefined){
                        [...city.codesPostaux].forEach(codeP => {
                            if(codeP === offer.lieuTravail.codePostal){
                                citiesDetails.push(offer)
                            }
                        })
                    }
                });
            });
            [...this.offersTarget.children].forEach(item => item.remove());
            this.paginationBtnTarget.classList.add('hidden');
            if(citiesDetails.length > 0){
                this.createOfferCard(citiesDetails);
                this.searchInputTarget.value ='';
                this.searchErrorTarget.classList.add('hidden');
                this.messageTarget.classList.add('hidden');
            }else{
                this.searchErrorTarget.classList.add('hidden');
                this.messageTarget.classList.remove('hidden');
            }
        }catch(error){
            console.log('Error villes', error);
        }
    }
}