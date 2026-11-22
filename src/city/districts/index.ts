// Registers every built district (import once, early), then loads the default one.
import './shore/index'
import './quarter/index'
import './makers/index'
import { activateDistrict } from './active'
import { DEFAULT_DISTRICT } from './registry'

activateDistrict(DEFAULT_DISTRICT)
