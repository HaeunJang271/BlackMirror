import {
  CircleDot,
  Clock,
  Droplets,
  Eye,
  Feather,
  Flame,
  Hand,
  Hexagon,
  type LucideIcon,
  Scale,
  Scan,
  Shuffle,
  Wind,
} from 'lucide-react'
import type { RelicId, RitualId } from '../types/game'

/** 의식 카드 → 아이콘. */
export const RITUAL_ICONS: Record<RitualId, LucideIcon> = {
  clairvoyant_coin: Eye,
  salt_circle: CircleDot,
  blood_pact: Droplets,
  swapped_card: Shuffle,
  ash_breath: Wind,
  forbidden_hand: Hand,
}

/** 유물 → 아이콘. */
export const RELIC_ICONS: Record<RelicId, LucideIcon> = {
  broken_hand: Clock,
  wet_matchbox: Flame,
  cracked_mirror: Scan,
  crow_feather: Feather,
  rusty_weight: Scale,
  ashen_seal: Hexagon,
}
