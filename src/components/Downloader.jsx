import React, { useState } from 'react';
import {
    Container,
    Paper,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Typography,
    LinearProgress,
    Box,
    Chip,
    Link,
    Stack,
    IconButton,
    Grid,
    Card,
    CardContent,
    CardHeader,
    Divider,
    Avatar
} from '@mui/material';
import {
    CloudDownload,
    Link as LinkIcon,
    Description,
    Error as ErrorIcon,
    DarkMode,
    LightMode,
    FileDownloadDone,
    Downloading
} from '@mui/icons-material';
import { ThemeProvider, createTheme, styled } from '@mui/material/styles';
import io from 'socket.io-client';

const socket = io('http://212.28.178.186:3000', {
    withCredentials: true
});

function Downloader() {
    const [darkMode, setDarkMode] = useState(false);
    const [url, setUrl] = useState('');
    const [type, setType] = useState('direct');
    const [fileName, setFileName] = useState('');
    const [downloads, setDownloads] = useState(new Map());

    const theme = createTheme({
        palette: {
            mode: darkMode ? 'dark' : 'light',
            primary: {
                main: darkMode ? '#BB86FC' : '#6200EE',
            },
            secondary: {
                main: darkMode ? '#03DAC6' : '#03DAC6',
            },
            background: {
                default: darkMode ? '#121212' : '#F5F5F5',
                paper: darkMode ? '#1E1E1E' : '#FFFFFF',
            },
        },
        typography: {
            fontFamily: 'Roboto, sans-serif',
        },
    });

    const formatBytes = (bytes, decimals = 2) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
    };

    const formatSpeed = (bytesPerSecond) => {
        if (!bytesPerSecond) return '0 MB/s';
        return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`;
    };

    const getStatusColor = (status) => {
        const colors = {
            starting: 'warning',
            downloading: 'info',
            completed: 'success',
            error: 'error'
        };
        return colors[status] || 'default';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://212.28.178.186:3000/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ url, type, fileName })
            });

            const { downloadId } = await response.json();

            setDownloads(prev => new Map(prev.set(downloadId, {
                progress: 0,
                speed: 0,
                downloaded: 0,
                total: 0,
                startTime: Date.now(),
                status: 'starting'
            })));

            socket.on(`download-progress-${downloadId}`, (data) => {
                setDownloads(prev => {
                    const download = prev.get(downloadId);
                    const timeDiff = (Date.now() - download.startTime) / 1000;
                    const speed = data.downloadedBytes ? data.downloadedBytes / timeDiff : 0;

                    return new Map(prev.set(downloadId, {
                        ...download,
                        progress: parseFloat(data.progress),
                        speed: speed,
                        downloaded: data.downloadedBytes,
                        total: data.totalBytes,
                        status: 'downloading'
                    }));
                });
            });

            socket.on(`download-complete-${downloadId}`, (data) => {
                setDownloads(prev => new Map(prev.set(downloadId, {
                    ...prev.get(downloadId),
                    progress: 100,
                    status: 'completed',
                    url: data.url
                })));
            });

            socket.on(`download-error-${downloadId}`, ({ error }) => {
                setDownloads(prev => new Map(prev.set(downloadId, {
                    ...prev.get(downloadId),
                    status: 'error',
                    error
                })));
            });

        } catch (error) {
            console.error('Error starting download:', error);
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{
                minHeight: '100vh',
                bgcolor: 'background.default',
                transition: 'background-color 0.3s ease',
                background: darkMode
                    ? 'linear-gradient(147deg, #000000 0%, #2c3e50 74%)'
                    : 'linear-gradient(147deg, #FFE53B 0%, #FF2525 74%)',
            }}>
                <Container maxWidth="md" sx={{ py: 4 }}>
                    <Card elevation={4} sx={{ mb: 4 }}>
                        <CardHeader
                            avatar={
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                    <CloudDownload />
                                </Avatar>
                            }
                            action={
                                <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
                                    {darkMode ? <LightMode /> : <DarkMode />}
                                </IconButton>
                            }
                            title={
                                <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
                                    File Downloader
                                </Typography>
                            }
                            subheader="Download files with ease and style"
                        />
                        <Divider />
                        <CardContent>
                            <form onSubmit={handleSubmit}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            placeholder="Enter URL or magnet link"
                                            label="URL"
                                            variant="outlined"
                                            InputProps={{
                                                startAdornment: <LinkIcon sx={{ mr: 1, color: 'action.active' }} />,
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            value={fileName}
                                            onChange={(e) => setFileName(e.target.value)}
                                            placeholder="Custom filename (optional)"
                                            label="Filename"
                                            variant="outlined"
                                            InputProps={{
                                                startAdornment: <Description sx={{ mr: 1, color: 'action.active' }} />,
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Download Type</InputLabel>
                                            <Select
                                                value={type}
                                                onChange={(e) => setType(e.target.value)}
                                                label="Download Type"
                                            >
                                                <MenuItem value="direct">Direct Download</MenuItem>
                                                <MenuItem value="torrent">Torrent</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            size="large"
                                            startIcon={<CloudDownload />}
                                            fullWidth
                                            sx={{ height: '100%' }}
                                        >
                                            Start Download
                                        </Button>
                                    </Grid>
                                </Grid>
                            </form>
                        </CardContent>
                    </Card>

                    <Stack spacing={2}>
                        {Array.from(downloads).map(([id, data]) => (
                            <Card key={id} elevation={2}>
                                <CardContent>
                                    {data.error ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                                            <ErrorIcon />
                                            <Typography>{data.error}</Typography>
                                        </Box>
                                    ) : (
                                        <Stack spacing={2}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Chip
                                                    label={data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                                                    color={getStatusColor(data.status)}
                                                    size="small"
                                                    icon={
                                                        data.status === 'completed' ? <FileDownloadDone /> :
                                                            data.status === 'downloading' ? <Downloading /> :
                                                                data.status === 'error' ? <ErrorIcon /> :
                                                                    null
                                                    }
                                                />
                                                {data.speed > 0 && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        {formatSpeed(data.speed)}
                                                    </Typography>
                                                )}
                                            </Box>

                                            <Box sx={{ width: '100%' }}>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={data.progress}
                                                    sx={{
                                                        height: 8,
                                                        borderRadius: 4,
                                                        '& .MuiLinearProgress-bar': {
                                                            backgroundImage: 'linear-gradient(to right, #6200EE, #03DAC6)'
                                                        }
                                                    }}
                                                />
                                            </Box>

                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {data.progress.toFixed(1)}%
                                                </Typography>
                                                {data.downloaded > 0 && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        {formatBytes(data.downloaded)} / {formatBytes(data.total)}
                                                    </Typography>
                                                )}
                                            </Box>

                                            {data.url && (
                                                <Link
                                                    href={data.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    underline="none"
                                                >
                                                    <Button
                                                        variant="outlined"
                                                        fullWidth
                                                        startIcon={<CloudDownload />}
                                                    >
                                                        Download Complete - Click to View File
                                                    </Button>
                                                </Link>
                                            )}
                                        </Stack>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                </Container>
            </Box>
        </ThemeProvider>
    );
}

export default Downloader;
