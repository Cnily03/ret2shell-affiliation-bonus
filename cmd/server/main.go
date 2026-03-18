package main

import (
	"errors"
	"flag"
	"fmt"
	"net/http"
	"os"
	"path"
	"time"

	"github.com/gorilla/mux"

	"affiliation-bonus/internal/api"
	"affiliation-bonus/internal/auth"
	"affiliation-bonus/internal/config"
	"affiliation-bonus/internal/service"
	"affiliation-bonus/internal/store"
)

func noDirList(fs http.FileSystem) http.FileSystem {
	return noDirListFS{fs: fs, tryFiles: []string{"index.html", "index.htm"}}
}

type noDirListFS struct {
	fs       http.FileSystem
	tryFiles []string
}

func (n noDirListFS) Open(name string) (http.File, error) {
	f, err := n.fs.Open(name)
	if err != nil {
		return nil, err
	}
	stat, err := f.Stat()
	if err != nil {
		f.Close()
		return nil, err
	}
	if stat.IsDir() {
		found := false
		for _, tf := range n.tryFiles {
			index, err := n.fs.Open(path.Join(name, tf))
			if err == nil {
				index.Close()
				found = true
				break
			}
		}
		if !found {
			f.Close()
			return nil, os.ErrNotExist
		}
	}
	return f, nil
}

func main() {
	port := flag.Int("p", 8000, "server port")
	flag.Parse()

	cfg, err := config.Load("config.toml")
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	r2sDB, err := store.ConnectR2SDatabase(cfg.Ret2Shell.Database)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	defer r2sDB.Close()
	fmt.Println("Ret2Shell database connected")

	appDB, err := store.ConnectAppDatabase(cfg.Database)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	defer appDB.Close()
	fmt.Println("App database connected")

	r2sSvc := service.NewR2SService(r2sDB, cfg.Server.ImageURITemplate)

	bonusSvc := &service.BonusService{
		R2S:    r2sSvc,
		AppDB:  appDB,
		Config: cfg.Bonus,
	}

	srv := &api.Server{
		R2S:          r2sSvc,
		AppDB:        appDB,
		BonusService: bonusSvc,
		AuthMW:       auth.Middleware(cfg.Ret2Shell.Auth.SigningKey),
	}

	r := mux.NewRouter()

	srv.SetupRoutes(r)

	staticPath := cfg.Server.StaticPath
	if info, err := os.Stat(staticPath); err == nil && info.IsDir() {
		r.PathPrefix("/").Handler(http.FileServer(noDirList(http.Dir(staticPath))))
	} else {
		r.PathPrefix("/").HandlerFunc(http.NotFound)
	}

	addr := fmt.Sprintf(":%d", *port)
	httpSrv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 35 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	fmt.Printf("Starting server on %s\n", addr)

	if err := httpSrv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
