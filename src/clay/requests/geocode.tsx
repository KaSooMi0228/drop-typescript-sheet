import { once } from "lodash";
import useSWR from "swr";
import * as React from "react";

const GOOGLE_MAPS_URL =
    "https://maps.googleapis.com/maps/api/js?key=AIzaSyBBTj5E3Idk-kgnPUpc1La7GrzUHbmCpj8&libraries=places";

type Services = {
    autocomplete: google.maps.places.AutocompleteService;
    places: google.maps.places.PlacesService;
};
function doLoadMapsApi(): Promise<Services> {
    return new Promise((resolve, reject) => {
        document.body.appendChild(
            Object.assign(document.createElement("script"), {
                type: "text/javascript",
                id: "google-maps-script",
                src: GOOGLE_MAPS_URL,
                onload: () => {
                    resolve({
                        autocomplete:
                            new google.maps.places.AutocompleteService(),
                        places: new google.maps.places.PlacesService(
                            document.createElement("div")
                        ),
                    });
                },
                onerror: reject,
            })
        );
    });
}

const loadMapsApi = once(doLoadMapsApi);

async function autocomplete(
    line1: string
): Promise<google.maps.places.AutocompletePrediction[]> {
    const { autocomplete, places } = await loadMapsApi();

    return new Promise((resolve, reject) => {
        autocomplete.getPlacePredictions(
            {
                input: line1,
                types: ["address"],
                componentRestrictions: {
                    country: "CA",
                },
                bounds: {
                    west: -131,
                    east: -114,
                    north: 52,
                    south: 48,
                },
            },
            (results, status) => {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    resolve(results);
                } else {
                    reject(status);
                }
            }
        );
    });
}

export function useAutocomplete(line: string) {
    return useSWR(line, autocomplete);
}

export async function lookupPlace(
    request: google.maps.places.PlaceDetailsRequest
): Promise<google.maps.places.PlaceResult> {
    const { places } = await loadMapsApi();
    return new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
        places.getDetails(request, (results, status) => {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                resolve(results);
            } else {
                reject(status);
            }
        });
    });
}
