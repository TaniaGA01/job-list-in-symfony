<?php

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Component\Cache\CacheItem;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;

class FranceTravailApiService {
    private HttpClientInterface $client;
    private CacheInterface $cache;
    private string $apiToken;
    private string $apiTokenClient;

    public function __construct(HttpClientInterface $client, CacheInterface $cache, ParameterBagInterface $params)
    {
        $this->client = $client;
        $this->cache = $cache;
        $this->apiToken = $params->get('FRANCE_TRAVAIL_API_TOKEN');
        $this->apiTokenClient = $params->get('FRANCE_TRAVAIL_API_CLIENT');   
    }

    public function getToken():string
    {
        return $this->cache->get('api_token', function (CacheItem $item) {
            $item->expiresAfter(60);
            return $this->requestNewToken();
        });
    }

    private function requestNewToken(): string
    {

        $body = http_build_query([
            'grant_type' => 'client_credentials',
            'client_id' => $this->apiTokenClient,
            'client_secret' => $this->apiToken,
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
        $data = $response->toArray();
        return $data['access_token'];
    }

    public function refreshToken(): void
    {
        $newToken = $this->requestNewToken();
        $this->cache->delete('api_token');
        $this->cache->get('api_token', fn () => $newToken);
    }
}