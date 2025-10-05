# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05"; # or "unstable"
  # Use https://search.nixos.org/packages to find packages
  packages = [
    # pkgs.go
    # pkgs.python311
    # pkgs.python311Packages.pip
    # pkgs.nodejs_20
    # pkgs.nodePackages.nodemon
    pkgs.docker
  ];
  # Sets environment variables in the workspace
  env = {};

  # Enable the Docker daemon
  services.docker.enable = true;

  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      # "vscodevim.vim"
      "google.gemini-cli-vscode-ide-companion"
    ];
    # Enable previews
    previews = {
      enable = false;
      previews = {
        # web = {
        #   command = ["npm" "run" "dev" "--" "--port" "$PORT"];
        #   manager = "web";
        # };
      };
    };
    # Workspace lifecycle hooks
    workspace = {
      # Runs when a workspace is first created
      onCreate = {
        # welcome = "echo 'Hello World!'";
      };
      # Runs every time the workspace is (re)started
      onStart = {
        # start-server = "npm run dev";
      };
    };
  };
}
