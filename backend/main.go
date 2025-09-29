// schedule backend
// ----------------
// PocketBase server that serves the built frontend (vite dist) from an embedded filesystem and
// wires up migration support. Intended for simple deployment: build the frontend, run the server.
package main

import (
	"embed"
	"io/fs"
	"log"
	"os"
	"strings"

	_ "schedule/migrations"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
)

// embed frontend/dist
//
//go:embed all:dist
var distFiles embed.FS

func main() {
	app := pocketbase.New()

	var DistDirFS, _ = fs.Sub(distFiles, "dist")

	// app.OnServe().BindFunc(func(se *core.ServeEvent) error {
	// 	// serves static files from the provided public dir (if exists)
	// 	se.Router.GET("/public/{path...}", apis.Static(os.DirFS("./pb_public"), false))
	//
	// 	return se.Next()
	//
	// })
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {

		se.Router.GET("/{path...}", apis.Static(DistDirFS, false))

		return se.Next()
	})

	// loosely check if it was executed using "go run"
	isGoRun := strings.HasPrefix(os.Args[0], os.TempDir())

	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		// enable auto creation of migration files when making collection changes in the Dashboard
		// (the isGoRun check is to enable it only during development)
		Automigrate: isGoRun,
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
