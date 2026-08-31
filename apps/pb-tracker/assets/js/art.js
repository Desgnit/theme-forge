/* Exercise pictograms — one small line drawing per movement, so you can see
 * at a glance what a card is before reading it. Hand-set stick figures in
 * the app's single stroke style: 64x64 grid, round caps, no fill. */
(function (PB) {
  "use strict";

  /* Each entry: [head cx, head cy, ...path strings]. */
  var ART = {
    bike: [44, 14,
      "M14 48a8 8 0 1 0 .1 0", "M50 48a8 8 0 1 0 .1 0",              // wheels
      "M14 48h14l8-14h10", "M36 34l6 14", "M46 30l4 4",              // frame + bars
      "M42 18l-6 8 6 8-8 6", "M42 18l6 6"                            // rider torso/leg/arm
    ],
    row: [22, 22,
      "M6 52h52", "M10 46h40",                                        // floor + rail
      "M18 46l-4-6", "M24 28l-2 12 10 2 8 4", "M24 30l12 2 8 2",      // seat post, leg, arms to handle
      "M44 34l2-14", "M46 20a6 10 0 1 0 .1 0"                         // chain + flywheel
    ],
    ski: [24, 12,
      "M42 4v14", "M50 4v14",                                         // cables from above
      "M26 18l8 10-4 12", "M28 22l14-4", "M28 22l22-4",               // torso + arms up to handles
      "M30 40l-6 12", "M30 40l8 10", "M8 56h48"                       // legs + floor
    ],
    run: [42, 10,
      "M40 16l-8 14", "M38 20l10 6", "M38 20l-12 2",                  // torso + arms
      "M32 30l10 8-2 12", "M32 30l-8 10-8 2",                         // legs mid-stride
      "M8 22h8", "M6 32h6"                                            // speed lines
    ],
    squat: [32, 12,
      "M14 22h36", "M14 18v8", "M50 18v8",                            // bar across the shoulders
      "M32 24v12", "M32 26l-9-3", "M32 26l9-3",                       // torso + hands on the bar
      "M32 36l-11 8 3 10", "M32 36l11 8-3 10", "M10 56h44"            // knees out, below parallel
    ],
    bench: [15, 38,
      "M10 44h34", "M14 44v9", "M38 44v9",                            // bench
      "M21 39h20l9 8", "M29 39V20", "M19 18h20", "M22 14v8",          // body, feet down, arm to bar
      "M36 14v8"
    ],
    deadlift: [16, 18,
      "M40 48a6 6 0 1 0 .1 0", "M52 48h6",                            // plate + bar stub
      "M19 24l8 11", "M27 35l6 8 1 11", "M27 35l-6 9-1 10",           // flat back hinge + legs
      "M20 26L44 47", "M6 56h52"                                      // arm down to the bar
    ],
    press: [32, 10,
      "M12 8h40", "M12 4v8", "M52 4v8",                               // bar overhead
      "M32 16v14", "M32 20l-10-8", "M32 20l10-8",                     // torso + locked arms
      "M32 30l-8 14 0 8", "M32 30l8 14 0 8", "M8 56h48"
    ],
    wallball: [22, 20,
      "M52 6v44", "M46 12a5 5 0 1 0 .1 0",                            // wall + target ball
      "M24 26l4 12-4 14", "M26 30l10-8", "M26 30l14-4",               // figure throwing up
      "M24 38l-8 12", "M6 56h42"
    ],
    burpee: [17, 24,
      "M19 28l11 7", "M28 33l12-5",                                   // leaping torso, arms forward
      "M30 35l-11 4", "M30 35l-7 11",                                 // legs trailing the jump
      "M24 12q17-8 30 8", "M54 12l1 9-9-1", "M6 56h52"                // flight arc + arrowhead
    ],
    lunge: [28, 11,
      "M28 17v16", "M28 22l9 5", "M28 22l-8 6",                       // upright torso
      "M28 33l12 7 0 14", "M28 33l-9 13-8 7",                        // front knee at 90, back knee low
      "M8 56h48"
    ],
    sledpull: [45, 15,
      "M6 42h14l3 8H8z", "M4 54h22",                                  // sled being dragged
      "M44 20l-5 16", "M44 24L23 42",                                 // lean-back + taut rope to sled
      "M39 36l8 8-1 10", "M39 36l13 5 1 13", "M30 56h28"              // feet braced away
    ],
    sledpush: [13, 17,
      "M44 30h12v12H44z", "M50 42v10", "M38 54h24",                   // sled ahead
      "M15 21l14 12", "M20 24l22 9", "M22 29l20 8",                   // low drive, both arms on it
      "M29 33l-9 9 4 12", "M29 33l-15 9-4 10", "M4 56h30"             // one leg driving, one extended
    ],
    hang: [32, 22,
      "M10 8h44", "M18 8v4", "M46 8v4",                               // pull-up bar
      "M32 26v16", "M32 28l-8-18", "M32 28l8-18",                     // straight hang
      "M32 42l-4 10", "M32 42l4 10"
    ]
  };

  PB.art = function (name, cls) {
    var a = ART[name];
    if (!a) return "";
    var out = ['<svg class="art ' + (cls || "") + '" viewBox="0 0 64 64" aria-hidden="true">'];
    out.push('<circle cx="' + a[0] + '" cy="' + a[1] + '" r="4.2"/>');
    for (var i = 2; i < a.length; i++) out.push('<path d="' + a[i] + '"/>');
    out.push("</svg>");
    return out.join("");
  };
})(window.PB = window.PB || {});
