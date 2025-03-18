<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Contracts\HttpClient\HttpClientInterface;


final class FranceTravailApiController extends AbstractController
{
    private HttpClientInterface $client;

    public function __construct(HttpClientInterface $client)    
    {
        $this->client = $client;
    }

    /**
     * Fonction permettant faire la requête pour obtenir le token d'accès en utilisant les données du client
     * @see https://francetravail.io/produits-partages/documentation/utilisation-api-france-travail/requeter-api
     * @return JsonResponse
     */
    #[Route('/france_travail/api', name: 'app_france_travail_api', methods: ['POST'])]
    public function getOffres(): JsonResponse
    {

        $apiToken = $this->getParameter('FRANCE_TRAVAIL_API_TOKEN');
        $apiTokenClient = $this->getParameter('FRANCE_TRAVAIL_API_CLIENT');

        $body = http_build_query([
            'grant_type' => 'client_credentials',
            'client_id' => $apiTokenClient,
            'client_secret' => $apiToken,
            'scope' => 'api_offresdemploiv2 o2dsoffre'
        ]);
        
        $response = $this->client->request(
            'POST',
            'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire',
            [
                'headers' => [
                    'Content-Type'=>'application/x-www-form-urlencoded'
                ],
                'body' => $body
            ]   
        );

        return new JsonResponse($response->toArray());
    }
}
