
import { useState, useRef, useEffect } from "react";
import {
    Box,
    Fab,
    Paper,
    Typography,
    IconButton,
    TextField,
    InputAdornment,
    CircularProgress,
    Collapse,
} from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import { useChatMutation } from "../../lib/api";

type Message = {
    id: string;
    text: string;
    sender: "user" | "bot";
    timestamp: Date;
};

export const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            text: "Olá! Sou a IA do Colégio Frei Ronaldo. Posso ajudar com dúvidas sobre dados, como 'quantos alunos temos?' ou 'quem está em risco?'.",
            sender: "bot",
            timestamp: new Date(),
        },
    ]);
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [sendMessage, { isLoading }] = useChatMutation();

    const handleToggle = () => setIsOpen((prev) => !prev);

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: "user",
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputValue("");

        try {
            const { response } = await sendMessage({ message: userMsg.text }).unwrap();
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: response,
                sender: "bot",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, botMsg]);
        } catch (error) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: "Desculpe, tive um problema ao processar sua mensagem. Tente novamente.",
                sender: "bot",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMsg]);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSend();
        }
    };

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    return (
        <Box
            sx={{
                position: "fixed",
                bottom: 32,
                right: 32,
                zIndex: 1000,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
            }}
        >
            <Collapse in={isOpen} orientation="vertical">
                <Paper
                    elevation={6}
                    sx={{
                        width: 350,
                        height: 450,
                        mb: 2,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    {/* Header */}
                    <Box
                        sx={{
                            p: 2,
                            bgcolor: "primary.main",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={1}>
                            <SmartToyIcon fontSize="small" />
                            <Typography variant="subtitle1" fontWeight={600}>
                                Data Chat
                            </Typography>
                        </Box>
                        <IconButton size="small" onClick={handleToggle} sx={{ color: "white" }}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    {/* Messages Area */}
                    <Box
                        sx={{
                            flex: 1,
                            p: 2,
                            overflowY: "auto",
                            bgcolor: "background.default",
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.5,
                        }}
                    >
                        {messages.map((msg) => (
                            <Box
                                key={msg.id}
                                sx={{
                                    alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                                    maxWidth: "85%",
                                }}
                            >
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 1.5,
                                        bgcolor: msg.sender === "user" ? "primary.light" : "grey.200",
                                        color: msg.sender === "user" ? "primary.contrastText" : "text.primary",
                                        borderRadius: 2,
                                        borderTopRightRadius: msg.sender === "user" ? 0 : 2,
                                        borderTopLeftRadius: msg.sender === "bot" ? 0 : 2,
                                    }}
                                >
                                    <Typography variant="body2">{msg.text}</Typography>
                                </Paper>
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, textAlign: msg.sender === "user" ? "right" : "left", fontSize: "0.7rem" }}>
                                    {msg.sender === "bot" ? "IA" : "Você"}
                                </Typography>
                            </Box>
                        ))}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* Input Area */}
                    <Box sx={{ p: 2, borderTop: 1, borderColor: "divider", bgcolor: "background.paper" }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Pergunte algo sobre os dados..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            disabled={isLoading}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={handleSend} disabled={!inputValue.trim() || isLoading} color="primary">
                                            {isLoading ? <CircularProgress size={20} /> : <SendIcon fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                </Paper>
            </Collapse>

            <Fab
                color="primary"
                aria-label="chat"
                onClick={handleToggle}
                sx={{
                    boxShadow: 4,
                    transition: "transform 0.2s",
                    "&:hover": { transform: "scale(1.1)" },
                }}
            >
                {isOpen ? <CloseIcon /> : <SmartToyIcon />}
            </Fab>
        </Box>
    );
};
