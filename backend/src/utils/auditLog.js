const { supabaseAdmin } = require('../config/supabase');

async function logAdminAction({ actorId, actionType, targetKey, metadata }) {
  if (!supabaseAdmin) {
    return;
  }

  try {
    await supabaseAdmin.from('admin_actions').insert({
      actor_id: actorId || null,
      action_type: actionType,
      target_key: targetKey || null,
      metadata: metadata || null
    });
  } catch (e) {
    console.error('auditLog insert failed', e.message);
  }
}

module.exports = { logAdminAction };
