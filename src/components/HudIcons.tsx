import {
  CircleDot,
  Bell, Hourglass, CandlestickChart, CupSoda,
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
  truth_bell: Bell,
  scale_flip: Scale,
  sand_glass: Hourglass,
  soul_candelabra: CandlestickChart,
}

/** 유물 → 아이콘. */
export const RELIC_ICONS: Record<RelicId, LucideIcon> = {
  broken_hand: Clock,
  wet_matchbox: Flame,
  cracked_mirror: Scan,
  crow_feather: Feather,
  rusty_weight: Scale,
  ashen_seal: Hexagon,
  golden_pan: Scale,
  wax_charm: Flame,
  chalice_of_ruin: CupSoda,
}
