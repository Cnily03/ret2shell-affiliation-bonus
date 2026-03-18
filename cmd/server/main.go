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

	"bxsctf-invite-bonus/internal/api"
	"bxsctf-invite-bonus/internal/auth"
	"bxsctf-invite-bonus/internal/config"
	"bxsctf-invite-bonus/internal/service"
	"bxsctf-invite-bonus/internal/store"
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

	db, err := store.ConnectDatabase(cfg.Ret2Shell.Database)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	defer db.Close()
	fmt.Println("Database connected")

	rdb, err := store.ConnectCache(cfg.Ret2Shell.Cache.URL)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	defer rdb.Close()
	fmt.Println("Cache connected")

	cachePrefix := fmt.Sprintf("%s:%d", cfg.App.Server.CachePrefix, cfg.App.Bonus.GameID)

	bonusSvc := &service.BonusService{
		DB:               db,
		Cache:            rdb,
		CachePrefix:      cachePrefix,
		Config:           cfg.App.Bonus,
		ImageURITemplate: cfg.App.Server.ImageURITemplate,
	}

	srv := &api.Server{
		DB:               db,
		Cache:            rdb,
		BonusService:     bonusSvc,
		AuthMW:           auth.Middleware(cfg.Ret2Shell.Auth.SigningKey),
		CachePrefix:      cachePrefix,
		ImageURITemplate: cfg.App.Server.ImageURITemplate,
	}

	r := mux.NewRouter()

	srv.SetupRoutes(r)

	staticPath := cfg.App.Server.StaticPath
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
