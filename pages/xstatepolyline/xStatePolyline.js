import Konva from "konva";
import { createMachine, interpret } from "xstate";


const stage = new Konva.Stage({
    container: "container",
    width: 400,
    height: 400,
});

const layer = new Konva.Layer();
stage.add(layer);

const MAX_POINTS = 10;
let polyline // La polyline en cours de construction;

const polylineMachine = createMachine(
    {
        /** @xstate-layout N4IgpgJg5mDOIC5QAcD2AbAngGQJYDswA6XCdMAYgFkB5AVQGUBRAYWwEkWBpAbQAYAuohSpYuAC65U+YSAAeiAGxE+qgOwBGAJwBWAMx8NegCwAOU2oA0ITImNqiirWpd8ATKa0bF9nQF8-azQsPEIiCAAnAEMAdwIoCiZYAGMo5DB+ISQQNDFJaVkFBAM3ImNjRUNTNy09LWM+KxtEAFo3BqI3PkUNHUqdNzVqxQCgjBwCYkjY+IoAISjkgGtYZEWMwVlciSkZbKLFUz5HU29NA2M+tz1rWwQWtT0iLUU1LVNjNy-Dy-9AnPGoSm0Ti+AStEYrA43EyW1EOwK+0QGjcyjcGnc3W8lUMFVuiD0+jKxjqqhJOlMPnaowBIUm4RBswhzDYnF4GiyIjyu0KyJ0Ome7g8GkpfHKhKadx05UcWj4FjUlzUfD0mhpwQmYWmoISTAAcgAVJgAJVh2W2+T2oCK9g0REehm61W0IvxxW8zzUNWlXVVOg0GgC-3wqAgcDhdMIcO5iOtrWMdq0SY8YqclP9GjdLT0gyIOixFL4tUOGku6sB9NI5GjCKt8mRT1MJm85h6rwTlKzAdMnTMRfc-uuvT+Y0jwJmYJrlt5xX9nXcTg8XnapzdvTtAcUXVM0s8Zl0Qb8QA */
        id: "polyLine",

        initial: "idle",

        states : {
            idle: {
                on: {
                    MOUSECLICK: {
                        actions : "createLine",
                target : "drawing"}
                }
            },

            drawing: {
                on: {
                    Escape: {actions :"abandon"},

                    Backspace: {
                        actions: "removeLastPoint",
                        cond: "plusDeDeuxPoints",
                        target: "drawing",
                        internal: true
                    },

                    

                    MOUSECLICK: [{
                        target: "drawing",
                        internal: true,
                        cond: "pasPlein",
                        actions : "setLastPoint"
                    }, {
                        actions : "saveLine"
                    }],

                    ENTER: {
                        actions: "saveLine",
                        cond: "plusDeDeuxPoints"
                    }
                }
            }
        }
    },
    // Quelques actions et guardes que vous pouvez utiliser dans votre machine
    {
        actions: {
            // Créer une nouvelle polyline
            createLine: (context, event) => {
                const pos = stage.getPointerPosition();
                polyline = new Konva.Line({
                    points: [pos.x, pos.y, pos.x, pos.y],
                    stroke: "red",
                    strokeWidth: 2,
                });
                layer.add(polyline);
            },
            // Mettre à jour le dernier point (provisoire) de la polyline
            setLastPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;

                const newPoints = currentPoints.slice(0, size - 2); // Remove the last point
                polyline.points(newPoints.concat([pos.x, pos.y]));
                layer.batchDraw();
            },
            // Enregistrer la polyline
            saveLine: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                // Le dernier point(provisoire) ne fait pas partie de la polyline
                const newPoints = currentPoints.slice(0, size - 2);
                polyline.points(newPoints);
                layer.batchDraw();
            },
            // Ajouter un point à la polyline
            addPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const newPoints = [...currentPoints, pos.x, pos.y]; // Add the new point to the array
                polyline.points(newPoints); // Set the updated points to the line
                layer.batchDraw(); // Redraw the layer to reflect the changes
            },
            // Abandonner le tracé de la polyline
            abandon: (context, event) => {
                polyline.remove();
            },
            // Supprimer le dernier point de la polyline
            removeLastPoint: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                const provisoire = currentPoints.slice(size - 2, size); // Le point provisoire
                const oldPoints = currentPoints.slice(0, size - 4); // On enlève le dernier point enregistré
                polyline.points(oldPoints.concat(provisoire)); // Set the updated points to the line
                layer.batchDraw(); // Redraw the layer to reflect the changes
            },
        },
        guards: {
            // On peut encore ajouter un point
            pasPlein: (context, event) => {
                return polyline.points().length < MAX_POINTS * 2;
            },
            // On peut enlever un point
            plusDeDeuxPoints: (context, event) => {
                // Deux coordonnées pour chaque point, plus le point provisoire
                return polyline.points().length > 6;
            },
        },
    }
);

// On démarre la machine
const polylineService = interpret(polylineMachine)
    .onTransition((state) => {
        console.log("Current state:", state.value);
    })
    .start();
// On envoie les événements à la machine
stage.on("click", () => {
    polylineService.send("MOUSECLICK");
});

stage.on("mousemove", () => {
    polylineService.send("MOUSEMOVE");
});

// Envoi des touches clavier à la machine
window.addEventListener("keydown", (event) => {
    console.log("Key pressed:", event.key);
    // Enverra "a", "b", "c", "Escape", "Backspace", "Enter"... à la machine
    polylineService.send(event.key);
});
