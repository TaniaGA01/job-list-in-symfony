import { Controller } from '@hotwired/stimulus';

export default class extends Controller {

    static targets = ['offers', 'prototype', 'pagination']

    connect() {
        this.getTocken().then()
    }

    /**
     * Fonction permettant obtenir le token d'accès à l'api
     */
    async getTocken(){
        let token = "";
        try {
            let getAccessToken = await fetch(`/france_travail/api`, {
                    method:'POST'
                });

            let response = await getAccessToken.json();
            token = response.access_token;

        } catch (error) {
            console.log('error', error)
        }
        //todo : voir pour reemplacer le 1 par une variable currentPage
        this.getOffres(token, 1).then()
    }

    /**
     * Fonction permettant obtenir les données de l'api
     * @param {string} token
     * @param {Number} page
     */
    async getOffres(token, page){
        const limit = 9;
        try {
            const start = (page - 1) * limit;
            const end = start + limit - 1;
    
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
            this.displayOffres(data.resultats)
        } catch (error) {
            console.error('Error au moment de récupérer les offres:', error);
        }
    };

    /**
     * Fonction permettant afficher les données dans le front
     * @param {Array} data
     */
    displayOffres(data){
        [...data].forEach(resultat =>{
            const 
                offreBlock = this.prototypeTarget.cloneNode(true),
                title = offreBlock.querySelector('#offreTitle'),
                description = offreBlock.querySelector('#offreDescription'),
                location = offreBlock.querySelector('#offreLocation'),
                entreprise = offreBlock.querySelector('#offreLocation')
            ;
            title.innerText = resultat.intitule;
            description.innerText = resultat.description;
            location.innerText = resultat.lieuTravail.libelle;
            entreprise.innerText = resultat.entreprise.nom;
            offreBlock.classList.remove('hidden');

            this.offersTarget.append(offreBlock);
            this.paginationTarget.classList.remove('hidden');

        })
    }
}