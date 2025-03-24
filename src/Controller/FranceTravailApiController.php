<?php

namespace App\Controller;

use App\Service\FranceTravailApiService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;


class FranceTravailApiController extends AbstractController
{
    private HttpClientInterface $client;
    private FranceTravailApiService $franceTravailApiService;

    public function __construct(HttpClientInterface $client, FranceTravailApiService $franceTravailApiService)    
    {
        $this->client = $client;
        $this->franceTravailApiService = $franceTravailApiService;
    }

    
    #[Route('/', name: 'home')]
    public function fetchData(): Response
    {

        $token = $this->franceTravailApiService->getToken();
        
         $limit = 10;
         $page = 1;
        try {
            $start = ($page - 1) * $limit;
            $end = $start + $limit - 1;
            $response = $this->client->request(
                'GET',
                "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search?range=$start-$end",
                [
                    'headers' => [
                        "Accept" => "application/json",
                        "Authorization" => "Bearer $token"
                    ],
                ]   
            );
            $offers = $response->toArray();
    
            return $this->render('home/index.html.twig', [
                'offers' => $offers
            ]);

        }catch (\Exception $e) {
            if ($e->getCode() === 401) {
                $this->franceTravailApiService->refreshToken();
                return $this->fetchData();
            }

            return $this->json(['error' => 'Impossible de retrouver les offres'], 500);
        }

    }
    #[Route('/get-token', name: 'get_token')]
    public function getToken(): JsonResponse
    {
        return $this->json(['token' => $this->franceTravailApiService->getToken()]);
    }
}
