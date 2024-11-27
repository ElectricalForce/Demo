const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const fs = require("fs");

// Učitavanje podataka o filmovima i serijama
const movies = JSON.parse(fs.readFileSync("./data/movies.json", "utf8"));

// Dodavanje loga za učitane podatke
console.log("Movies data:", movies);

// Definisanje manifestacije dodatka
const manifest = {
    id: "com.efprojectpro.balkanflix",
    version: "1.0.0",
    name: "BalkanFlix",
    description: "Addon with manually added movies and series",
    resources: ["catalog", "stream"],
    types: ["movie", "series"],
    catalogs: [
        {
            type: "movie",
            id: "custom_movies",
            name: "BalkanFlix",
        },
        {
            type: "series",
            id: "custom_series",
            name: "BalkanFlix",
        },
    ],
    logo: "https://i.postimg.cc/2jtbpyH0/EFProject-Logo.png" // Zameni sa pravom putanjom do loga
};

// Kreiranje dodatka
const builder = new addonBuilder(manifest);

// Funkcija za kreiranje stream objekta
const createStream = (streamUrl) => {
    if (streamUrl.includes("youtube.com") || streamUrl.includes("youtu.be")) {
        return {
            title: "Watch on YouTube",
            ytId: streamUrl.split("v=")[1] || streamUrl.split("/").pop(),
        };
    } else {
        return {
            title: "Watch Now",
            url: streamUrl,
        };
    }
};

// Ruta za katalog
builder.defineCatalogHandler((args) => {
    console.log("CatalogHandler args:", args); // Log za args
    if (args.type === "movie" && args.id === "custom_movies") {
        const movieMetas = movies.filter((m) => m.type === "movie");
        console.log("Filtered movies:", movieMetas); // Log za filtrirane filmove
        return Promise.resolve({ metas: movieMetas });
    }
    if (args.type === "series" && args.id === "custom_series") {
        const seriesMetas = movies.filter((m) => m.type === "series");
        console.log("Filtered series:", seriesMetas); // Log za filtrirane serije
        return Promise.resolve({ metas: seriesMetas });
    }
    return Promise.resolve({ metas: [] });
});

// Ruta za strimove
builder.defineStreamHandler((args) => {
    console.log("StreamHandler args:", args); // Log za args
    if (args.type === "movie") {
        const movie = movies.find((m) => m.id === args.id && m.type === "movie");
        console.log("Found movie:", movie); // Log za pronađeni film
        if (movie) {
            return Promise.resolve({
                streams: [createStream(movie.stream)],
            });
        }
    } else if (args.type === "series") {
        const series = movies.find((m) => m.id === args.id && m.type === "series");
        console.log("Found series:", series); // Log za pronađenu seriju
        if (series) {
            const season = series.seasons.find((s) => s.number === parseInt(args.season));
            console.log("Found season:", season); // Log za pronađenu sezonu
            if (season) {
                const episode = season.episodes.find((e) => e.id === args.episodeId);
                console.log("Found episode:", episode); // Log za pronađenu epizodu
                if (episode) {
                    return Promise.resolve({
                        streams: [createStream(episode.stream)],
                    });
                }
            }
        }
    }
    return Promise.resolve({ streams: [] });
});

// Pokretanje servera
serveHTTP(builder.getInterface(), { port: 7000 });
console.log("Addon running on http://localhost:7000");
