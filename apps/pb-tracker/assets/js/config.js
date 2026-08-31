/* Project wiring — which Supabase project this copy of the app syncs with.
 *
 * The anon key is PUBLIC by design: it only lets a browser talk to the
 * project, and row-level security (supabase/schema.sql) decides what any
 * signed-in person can actually see. Point another deployment at another
 * project by editing these two lines, or leave SYNC_DEFAULTS undefined to
 * make sync a manual paste-in on the Data screen. */
(function (PB) {
  "use strict";
  PB.SYNC_DEFAULTS = {
    url: "https://tzicbkijfvvzuorfgfxh.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6aWNia2lqZnZ2enVvcmZnZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNjU0MDYsImV4cCI6MjEwMzc0MTQwNn0.VClzE8GWTQ9l99C9PxfdftSXVRaeiE4LYaQcyOVFhfA"
  };
})(window.PB = window.PB || {});
