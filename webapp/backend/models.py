"""
Model architecture used in training notebook.
Compatible with exported checkpoint keys in outputs/best_model.pkl.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models


class SoftAttention(nn.Module):
    """Soft attention over sequence features."""

    def __init__(self, hidden_dim: int):
        super().__init__()
        self.attn = nn.Linear(hidden_dim, hidden_dim)
        self.v = nn.Linear(hidden_dim, 1, bias=False)

    def forward(self, lstm_output: torch.Tensor):
        energy = torch.tanh(self.attn(lstm_output))
        scores = self.v(energy).squeeze(-1)
        weights = F.softmax(scores, dim=1)
        context = torch.bmm(weights.unsqueeze(1), lstm_output).squeeze(1)
        return context, weights


class PneumoniaClassifier(nn.Module):
    """ResNet50 + BiLSTM + Soft-Attention for CXR binary classification."""

    def __init__(self, lstm_hidden: int = 128, feature_dim: int = 256, dropout: float = 0.6):
        super().__init__()

        # Use weights=None to avoid internet download at runtime;
        # checkpoint loading restores trained weights.
        backbone = models.resnet50(weights=None)
        self.cnn = nn.Sequential(*list(backbone.children())[:-2])
        self.cnn_out_dim = 2048

        self.feature_proj = nn.Sequential(
            nn.Linear(self.cnn_out_dim, feature_dim),
            nn.LayerNorm(feature_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
        )

        self.lstm = nn.LSTM(
            input_size=feature_dim,
            hidden_size=lstm_hidden,
            num_layers=1,
            batch_first=True,
            bidirectional=True,
            dropout=0.0,
        )
        lstm_out_dim = lstm_hidden * 2

        self.attention = SoftAttention(lstm_out_dim)

        self.classifier = nn.Sequential(
            nn.Linear(lstm_out_dim, 128),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(128, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        batch = x.size(0)
        features = self.cnn(x)
        seq = features.view(batch, self.cnn_out_dim, -1).permute(0, 2, 1)
        seq = self.feature_proj(seq)
        lstm_out, _ = self.lstm(seq)
        context, _ = self.attention(lstm_out)
        logit = self.classifier(context)
        return logit


class ResNet50AttentionOnly(nn.Module):
    """ResNet50 + Soft-Attention for CXR binary classification."""

    def __init__(self, dropout: float = 0.6):
        super().__init__()

        # Use weights=None to avoid internet download at runtime;
        # checkpoint loading restores trained weights.
        backbone = models.resnet50(weights=None)
        self.backbone = nn.Sequential(*list(backbone.children())[:-1])

        self.energy = nn.Linear(32, 1)
        self.classifier = nn.Sequential(
            nn.Linear(32, 256),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(256, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        batch = x.size(0)
        features = self.backbone(x).flatten(1)
        seq = features.view(batch, 64, 32)

        energy = torch.tanh(self.energy(seq))
        alpha = torch.softmax(energy, dim=1)
        context = torch.sum(seq * alpha, dim=1)

        self.attention_weights = alpha.squeeze(-1)
        logit = self.classifier(context)
        return logit
