using System.Windows;
using System.Net.Http;
using System.IO;
using CmlLib.Core.Auth;
using HeyOddLauncher.Core.Manifest;
using HeyOddLauncher.Services;

namespace HeyOddLauncher;

public partial class MainWindow : Window
{
    private readonly HttpClient _httpClient = new();
    private readonly LauncherSettings _settings;
    private readonly string _instanceRoot;
    private readonly MicrosoftMinecraftAuth _auth;
    private readonly GameService _game;
    private readonly BundledPackService _bundledPack = new();
    private MSession? _session;
    private bool _busy;

    public MainWindow()
    {
        InitializeComponent();
        _settings = LauncherSettings.Load();
        _instanceRoot = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "HeyOdd", "Minecraft");
        _auth = new(_settings.MicrosoftClientId);
        _game = new(_instanceRoot);
        _game.StatusChanged += (_, message) => Dispatcher.Invoke(() => StatusText.Text = message);
        Loaded += async (_, _) => await RefreshStateAsync();
    }

    private async Task RefreshStateAsync()
    {
        var state = await LocalStateStore.ReadAsync(_instanceRoot, CancellationToken.None);
        VersionText.Text = state is null ? "설치되지 않음" : $"pack {state.PackVersion}";
    }

    private async void Login_Click(object sender, RoutedEventArgs e)
    {
        if (_busy) return;
        await RunBusyAsync(async () =>
        {
            StatusText.Text = "Microsoft 로그인 창을 여는 중…";
            _session = await _auth.SignInAsync(true);
            AccountText.Text = $"{_session.Username} 계정으로 로그인됨";
            StatusText.Text = "로그인이 완료되었습니다.";
        });
    }

    private async void Play_Click(object sender, RoutedEventArgs e)
    {
        if (_busy) return;
        await RunBusyAsync(async () =>
        {
            _session ??= await TrySilentThenInteractiveAsync();
            Headline.Text = "게임을 준비하고 있습니다";
            var manifestClient = new ManifestClient(_httpClient);
            var manifest = await _bundledPack.LoadManifestAsync(CancellationToken.None);
            _bundledPack.SeedSettings(_instanceRoot);
            var progress = new Progress<SyncProgress>(p =>
            {
                InstallProgress.Value = p.Total == 0 ? 100 : p.Completed * 100d / p.Total;
                StatusText.Text = $"팩 파일 확인 중 · {p.CurrentFile}";
            });
            await manifestClient.SyncAsync(manifest, _instanceRoot, progress);
            var versionName = await _game.EnsureGameAsync(CancellationToken.None);
            await LocalStateStore.WriteAsync(_instanceRoot, new(manifest.PackVersion, DateTimeOffset.UtcNow), CancellationToken.None);
            VersionText.Text = $"pack {manifest.PackVersion}";
            StatusText.Text = "Minecraft를 시작합니다…";
            await _game.LaunchAsync(versionName, _session, _settings.MaximumRamMb);
            WindowState = WindowState.Minimized;
        });
    }

    private async Task<MSession> TrySilentThenInteractiveAsync()
    {
        try { return await _auth.SignInAsync(false); }
        catch { return await _auth.SignInAsync(true); }
    }

    private async Task RunBusyAsync(Func<Task> action)
    {
        _busy = true;
        LoginButton.IsEnabled = PlayButton.IsEnabled = false;
        try { await action(); }
        catch (Exception ex)
        {
            Headline.Text = "준비 중 문제가 발생했습니다";
            StatusText.Text = ex.Message;
        }
        finally
        {
            _busy = false;
            LoginButton.IsEnabled = PlayButton.IsEnabled = true;
        }
    }
}
